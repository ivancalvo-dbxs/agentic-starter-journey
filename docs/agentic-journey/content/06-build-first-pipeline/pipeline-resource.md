---
sidebar_label: Pipeline resource
description: Add a medallion SDP pipeline to the bundle with databricks-pipelines, including incremental ingestion and expectations.
---

# Pipeline resource

**Goal:** a bronze, silver, gold Spark Declarative Pipeline defined as a bundle resource, deployed and running against the dev target.

**Skill:** `databricks-pipelines` (databricks-agent-skills). Invoke it before writing any pipeline code, not after. `databricks-dabs` for the resource YAML.

**Prerequisites:** [Project repo](/docs/06-build-first-pipeline/project-repo) validating clean.

## Inputs

Collect all of these before writing code.
The first four decide the pipeline's shape; get them wrong and the fix is dropping tables, not editing YAML.

| Input | Source | How to obtain |
|---|---|---|
| Source path or table | Human | The exact URI, `s3://bucket/prefix/`. Must sit inside an external location from [5. Access your data](/docs/05-access-your-data). |
| Source format | Human | `json`, `csv`, `parquet`, `avro`. Ask rather than sniffing, then confirm against a sample. |
| Arrival pattern | Human | Files landing continuously, or a periodic full extract |
| Update semantics | Human | Append only, or upserts and change tracking. Upserts mean Auto CDC and need a key plus a sequence column. |
| Expectations | Human | The actual rules: which columns are never null, which ranges are valid, what a duplicate means. Push for specifics. |
| Target catalog | You derive | The bundle's `catalog` variable |
| Target schemas | You derive | `<project>_bronze`, `<project>_silver`, `<project>_gold` |
| Language | Human | SQL or Python. Sinks, ForEachBatch sinks, CDC from snapshots, and custom data sources are Python-only. |
| Serverless? | You derive | Default yes. Automatic incremental refresh of aggregating materialized views needs serverless plus Delta row tracking on the source. |

:::warning
Ask the arrival pattern before choosing a dataset type.
A streaming source needs a streaming table; a batch source needs a materialized view.
You cannot change a streaming table into a materialized view in place, and a full refresh does not help: the table has to be dropped or the dataset renamed.
:::

## The layer mapping

| Layer | Dataset type | Why |
|---|---|---|
| Bronze | Streaming table with Auto Loader | Raw, exactly as it arrived. Nothing filtered or deduplicated, so a broken downstream transformation can be reprocessed from here. |
| Silver | Streaming table, or a streaming table populated by Auto CDC for upserts | Cleaned, deduplicated, conformed. The source of truth for ad-hoc queries. |
| Gold | Materialized view | Aggregates over the full dataset. A streaming table is append-only and will not recompute an aggregate when source rows change; a materialized view does. |

Gold reading from a streaming table needs a **batch** read, `spark.read.table` in Python or `SELECT ... FROM <table>` without `STREAM` in SQL.
Using a streaming read for an aggregation is the most common mistake in this layer.

## Run

### 1. Confirm the source is reachable and the schema is what they said

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT * FROM read_files(\"<source-path>\", format => \"<format>\") LIMIT 5",
  "wait_timeout": "50s"
}' | jq '.manifest.schema.columns[] | {name, type_name}'
```

Do this before writing the pipeline.
Auto Loader `schemaHints` that disagree with the actual files fail at ingest with a `Column not found`, and that error is much harder to read than this output.

### 2. Write the pipeline source

Invoke `databricks-pipelines` with the collected inputs.
Its decision tree picks the dataset types and features; its reference file per feature and language has the exact API.
Read the reference file for the feature before writing the code.

Shape of a bronze streaming table with Auto Loader and expectations, in SQL:

```sql
CREATE OR REFRESH STREAMING TABLE orders_bronze
  (CONSTRAINT valid_id EXPECT (order_id IS NOT NULL) ON VIOLATION DROP ROW)
AS SELECT *, _metadata.file_path AS source_file, current_timestamp() AS ingested_at
   FROM STREAM read_files('${source_path}', format => 'json');
```

`FROM STREAM read_files(...)` is what engages Auto Loader.
Plain `FROM read_files(...)` is a batch query and fails with `Cannot create streaming table from batch query`.

Note `CREATE OR REFRESH`, not `CREATE OR REPLACE`.
The latter is standard SQL and not valid here.

### 3. Add the resource to the bundle

```yaml
# resources/<project>.pipeline.yml
resources:
  pipelines:
    <project>_medallion:
      name: ${bundle.name}-medallion
      catalog: ${var.catalog}
      schema: ${var.schema_prefix}_bronze
      serverless: true
      libraries:
        - glob:
            include: ../src/pipelines/**
      configuration:
        source_path: ${var.source_path}
```

Targets other than bronze come from fully-qualified dataset names in the source, `${var.catalog}.${var.schema_prefix}_gold.orders_daily`, since the pipeline has one default schema.

Declare `source_path` as a variable in `databricks.yml` with a per-target value.
A dev pipeline reading the production landing path is the failure this prevents.

### 4. Validate and deploy to dev

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
databricks bundle run <project>_medallion --target dev --profile <name>
```

Deploy to dev only.
Staging and production go through the CI/CD workflow in [13. CI/CD and DevOps](/docs/13-ci-cd-devops/).

## Verify

```bash
# Pipeline exists and the last update succeeded
databricks bundle run <project>_medallion --target dev --profile <name> -o json \
  | jq -r '.state, .cause'

# All three layers materialized
for layer in bronze silver gold; do
  echo "== $layer"
  databricks tables list --catalog <catalog> --schema <project>_$layer --profile <name> -o json \
    | jq -r '.[] | .name'
done

# Gold has rows, and they came from the source
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS rows FROM <catalog>.<project>_gold.<table>",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0][0]'
```

Expect `COMPLETED`, tables listed in all three schemas, and a non-zero row count in gold.

Check the expectations actually fired rather than assuming they are wired:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT explode(from_json(get_json_object(details, \"$.flow_progress.data_quality.expectations\"), \"array<struct<name:string,passed_records:bigint,failed_records:bigint>>\")) AS e FROM event_log(TABLE(<catalog>.<project>_bronze.orders_bronze)) WHERE event_type = \"flow_progress\"",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array'
```

Expect a row per expectation with pass and fail counts.
An empty result means the expectations are not attached to the dataset.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot create streaming table from batch query` | `FROM read_files(...)` instead of `FROM STREAM read_files(...)` | Add `STREAM` |
| `CREATE OR REPLACE` rejected | Not valid for SDP datasets | Use `CREATE OR REFRESH` |
| `Column not found` at ingest | `schemaHints` disagree with the files | Sample the source with `read_files` and align the hints |
| Pipeline stuck `INITIALIZING` on serverless | Cold start | Normal, takes a few minutes. Do not kill it. |
| Gold aggregate never updates when source rows change | Gold is a streaming table, which is append-only | Make it a materialized view with a batch read |
| Materialized view falls back to full recompute | No serverless, or no Delta row tracking on the source | Serverless plus `delta.enableRowTracking = true` |
| SCD2 query returns nothing on `START_AT` | Columns are `__START_AT` and `__END_AT`, double underscore | `WHERE __END_AT IS NULL` for current rows |
| Real error missing from the events output | Reading `.message`, which only says the update failed | Read `error.exceptions[0].message` |
| `databricks fs ls /Volumes/...` errors | Volume paths still need the `dbfs:` prefix | `databricks fs ls dbfs:/Volumes/...` |

## Next

- **Do next:** [7. Query and explore](/docs/07-query-and-explore)
- **Manual fallback:** [Starter Journey: Build the first pipeline](https://databricks-solutions.github.io/starter-journey/docs/07-build-first-pipeline/)
- **Reference:** [Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)
