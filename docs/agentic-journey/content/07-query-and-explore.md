---
sidebar_position: 0
sidebar_label: 7. Query and explore
description: Run remote queries against the Unity Catalog tables and profile them before building analytics on top.
---

# 7. Query and explore

**Goal:** the pipeline output profiled and understood, from the CLI, before anything is built on top of it.

**Skill:** `databricks-dbsql` (databricks-agent-skills) for SQL warehouse features. `databricks-data-discovery` when the user asks a question in natural language instead of naming tables.

**Prerequisites:** [6. Pipeline resource](/docs/06-build-first-pipeline/pipeline-resource) deployed, with rows in the gold schema.

Do this before section 8.
A metric view built on a column you assumed was never null, or a Genie Agent pointed at a table with three duplicate grains, produces confident wrong numbers rather than an error.

## Which skill

| The user says | Skill |
|---|---|
| "Query `catalog.schema.table`", or names a SQL feature | `databricks-dbsql` |
| "What tables are in X", "where does Y live", "how many orders last month" | `databricks-data-discovery`, which routes to Genie |
| "Write me a SQL query for ..." | `databricks-data-discovery` |

`databricks-data-discovery` falls back to `information_schema` exploration when Genie is unavailable, so it works on a fresh workspace too.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Warehouse ID | You derive | `databricks warehouses list -o json \| jq -r '.[] \| "\(.id)\t\(.name)\t\(.state)"'` |
| Catalog and schemas | You derive | The bundle's `catalog` variable, plus the medallion schemas |
| Grain of each gold table | You derive from the data | Run the profile queries below. Do not assume. |
| Business questions to answer | Human | What they actually want to know. This becomes the metric view measures in section 8. |

Start the warehouse if it is stopped:

```bash
databricks warehouses start <warehouse-id> --profile <name>
```

## Run

Execute SQL through the statement API.
It is synchronous up to the wait timeout and returns JSON, so it composes with `jq`.

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "<sql>",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array'
```

For a statement that outruns 50 seconds, the response returns a `statement_id` with state `PENDING` or `RUNNING`. Poll it:

```bash
databricks api get /api/2.0/sql/statements/<statement-id> --profile <name> \
  | jq -r '.status.state'
```

## The exploratory set

Run these against each gold table before building on it.
They answer the four questions that break downstream analytics.

### 1. What is here

```sql
SELECT table_name, table_type, comment
FROM <catalog>.information_schema.tables
WHERE table_schema = '<project>_gold'
ORDER BY table_name;
```

### 2. What is the shape

```sql
DESCRIBE EXTENDED <catalog>.<project>_gold.<table>;
```

### 3. Is the grain what you think it is

The single most useful query in this section.
A row count above the distinct count of the intended key means the grain is not what the table name implies, and every aggregate built on it will double count.

```sql
SELECT count(*) AS rows,
       count(DISTINCT <key>) AS distinct_keys,
       count(*) - count(DISTINCT <key>) AS dupes
FROM <catalog>.<project>_gold.<table>;
```

### 4. Where are the nulls and what are the ranges

```sql
SELECT
  count(*) AS rows,
  count(<measure_col>) AS non_null_measure,
  round(min(<measure_col>), 2) AS min_measure,
  round(max(<measure_col>), 2) AS max_measure,
  min(<date_col>) AS earliest,
  max(<date_col>) AS latest
FROM <catalog>.<project>_gold.<table>;
```

A `latest` well behind today means the pipeline is not picking up new files, which is a pipeline bug surfacing here rather than in section 6.

### 5. Does the medallion chain hold

Silver should not have more rows than bronze unless the pipeline explicitly fans out.

```sql
SELECT 'bronze' AS layer, count(*) AS rows FROM <catalog>.<project>_bronze.<table>
UNION ALL
SELECT 'silver', count(*) FROM <catalog>.<project>_silver.<table>
UNION ALL
SELECT 'gold', count(*) FROM <catalog>.<project>_gold.<table>;
```

## Verify

The section is done when you can state, for each gold table: its grain, its date range, which columns carry nulls, and which columns are candidate measures and dimensions.
Report that as a table.
Those are the inputs section 8 needs.

```bash
# Sanity check that the profile ran against the right thing
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT current_catalog(), current_schema()",
  "wait_timeout": "30s"
}' | jq -r '.result.data_array[0] | join(".")'
```

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Statement returns `PENDING` and no rows | Query outran `wait_timeout` | Poll `/api/2.0/sql/statements/<id>` rather than re-running |
| `Warehouse is stopped` | Auto-stop kicked in | `databricks warehouses start <id>`, then retry |
| `TABLE_OR_VIEW_NOT_FOUND` on a table you can see in the UI | Wrong catalog, or the caller lacks `USE CATALOG` and `USE SCHEMA` | Fully qualify the name; check grants from [Create catalogs](/docs/04-data-governance-strategy/create-catalogs) |
| Row counts differ between two runs | Pipeline is still ingesting | Expected on a streaming pipeline. Note it rather than reporting inconsistency. |
| Gold row count above silver | Join fan-out in the pipeline | A pipeline bug. Fix it in section 6 before building analytics. |

## Next

- **Do next:** [8. Unified analytics](/docs/08-unified-analytics/)
- **Reference:** [SQL statement execution API](https://docs.databricks.com/api/workspace/statementexecution)
