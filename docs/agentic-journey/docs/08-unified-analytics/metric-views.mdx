---
sidebar_label: Metric views
description: Define governed KPIs as Unity Catalog metric views, shipped as a SQL task in a bundle job.
---

# Metric views

**Goal:** the project's KPIs defined once as Unity Catalog metric views, registered by a bundle job, queryable from SQL, dashboards, and Genie.

**Skill:** `databricks-metric-views` (databricks-agent-skills). `databricks-dabs` for the job that applies them.

**Prerequisites:** [7. Query and explore](/docs/07-query-and-explore) complete. DBR 17.2 or later for YAML version 1.1, and 17.3 or later for `synonyms`, `display_name`, and `format`.

A metric view is not a bundle resource type.
It ships as `CREATE OR REPLACE VIEW ... WITH METRICS LANGUAGE YAML` in a SQL file, run by a SQL task, and that job is the bundle resource.
One extra hop, still fully in Git.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Measures | Human | The KPI formulas in business terms: "revenue is the sum of total_amount on confirmed orders". Get the filter conditions too, they belong in the definition. |
| Dimensions | Human | How they slice: by month, by region, by status. Ask which status codes mean what, so the definition can map them to readable labels. |
| Source table | You derive | A gold table, or a silver fact table for a star schema |
| Grain | You derive | From [7. Query and explore](/docs/07-query-and-explore). A wrong grain double counts every measure silently. |
| Target catalog and schema | You derive | The bundle's `catalog` variable, gold schema |
| Warehouse ID | You derive | Bundle variable |

Push for specifics on measures.
"Total revenue" is not a definition; "sum of `total_amount` where `status = 'confirmed'`, excluding refunds" is.
The whole value of a metric view is that this decision is recorded in one place, so a vague answer here defeats the point.

## Run

### 1. Profile the source

You did this in section 7. If the source is a table you have not profiled, do it now: cardinality of each candidate dimension, min/max and percentiles for each candidate measure, top categorical values. Sample rows are not enough to catch a grain problem.

### 2. Write the metric view SQL

```sql
-- src/<project>_kpis.metric_view.sql
CREATE OR REPLACE VIEW {{catalog}}.{{schema}}.<project>_kpis
WITH METRICS
LANGUAGE YAML
AS $$
version: 1.1
source: {{catalog}}.{{schema}}.orders_daily
comment: "Order KPIs for <project>"
filter: status = 'confirmed'
dimensions:
  - name: Order Month
    expr: date_trunc('MONTH', order_date)
    comment: "Month of order"
  - name: Region
    expr: region
measures:
  - name: Order Count
    expr: COUNT(1)
  - name: Total Revenue
    expr: SUM(total_amount)
    comment: "Confirmed order revenue"
  - name: Revenue per Customer
    expr: SUM(total_amount) / COUNT(DISTINCT customer_id)
$$;
```

`{{catalog}}` and `{{schema}}` are substituted from job parameters at run time, which is what makes the same file deployable to dev, staging, and production.

A ratio measure has to be defined as a ratio of sums, as above.
Defining it as an average of per-row ratios gives a different and usually wrong number once it is aggregated over any dimension.

### 3. Add the job that applies it

```yaml
# resources/<project>_kpis.job.yml
resources:
  jobs:
    <project>_kpis:
      name: ${bundle.name}-kpis
      parameters:
        - name: catalog
          default: ${var.catalog}
        - name: schema
          default: ${var.schema_prefix}_gold
      tasks:
        - task_key: register_metric_views
          sql_task:
            warehouse_id: ${var.warehouse_id}
            file:
              path: ../src/<project>_kpis.metric_view.sql
```

Because it is a job, it can also be scheduled or chained after the pipeline in [11. Orchestration](/docs/11-orchestration).
A metric view definition does not need re-running on a schedule, but re-running it is how a definition change reaches an environment.

### 4. Deploy and run against dev

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
databricks bundle run <project>_kpis --target dev --profile <name>
```

## Verify

```bash
# The view is registered and carries metric metadata
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "DESCRIBE EXTENDED <catalog>.<project>_gold.<project>_kpis",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[] | @tsv'
```

Then query it, which is the check that matters:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT `Order Month`, MEASURE(`Total Revenue`) AS revenue, MEASURE(`Order Count`) AS orders FROM <catalog>.<project>_gold.<project>_kpis GROUP BY ALL ORDER BY ALL LIMIT 12",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array'
```

Expect a row per month with plausible values.
Then reconcile against the source, because a metric view that returns numbers is not the same as one that returns the right numbers:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT (SELECT MEASURE(`Total Revenue`) FROM <catalog>.<project>_gold.<project>_kpis) AS via_metric_view, (SELECT SUM(total_amount) FROM <catalog>.<project>_gold.orders_daily WHERE status = \"confirmed\") AS via_raw_sql",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

The two numbers must match.
A mismatch means the metric view's filter or grain disagrees with what you just wrote in raw SQL, and that is worth resolving before a dashboard publishes the wrong one.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `SELECT *` returns an error | Not supported on metric views | Name the dimensions and wrap measures in `MEASURE()` |
| `Column not found` on a measure name | Measure referenced without `MEASURE()` | `MEASURE(\`Total Revenue\`)`, with backticks for names containing spaces |
| Parse error on the YAML body | DBR below 17.2 for `version: 1.1`, or below 17.3 for `synonyms` / `display_name` / `format` | Check the warehouse channel, or drop to a lower YAML version |
| Metric view registers but returns no rows | `filter` excludes everything, often a status code that does not exist in the data | Check the actual distinct values in the source |
| Numbers double what raw SQL returns | Source grain is coarser than assumed, or a join fans out | Re-profile the source. See [7. Query and explore](/docs/07-query-and-explore#3-is-the-grain-what-you-think-it-is). |
| Ratio measure wrong when sliced | Defined as an average of ratios instead of a ratio of sums | `SUM(a) / COUNT(DISTINCT b)`, not `AVG(a / b)` |

## Next

- **Do next:** [Dashboards](/docs/08-unified-analytics/dashboards)
- **Manual fallback:** [Starter Journey: Business semantics](https://databricks-solutions.github.io/starter-journey/docs/09-unified-analytics/business-semantics/)
- **Reference:** [Metric views](https://docs.databricks.com/aws/en/metric-views/), [`metric_view` bundle example](https://github.com/databricks/bundle-examples/tree/main/knowledge_base/metric_view)
