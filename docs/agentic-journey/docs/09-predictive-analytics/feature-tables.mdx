---
sidebar_label: Feature tables
description: Create Unity Catalog feature tables or Feature Views with point-in-time correctness.
---

# Feature tables

**Goal:** features stored in Unity Catalog so training and scoring read the same definition, with point-in-time correctness where features change over time.

**Skill:** `databricks-ml-training` (databricks-agent-skills).

**Prerequisites:** silver tables with the raw signals, from [6. Build the first pipeline](/docs/06-build-first-pipeline/).

Skip this page when the features are already columns on a silver table, nothing else needs to reuse them, and the features do not change over time.
A feature table earns its keep in three cases: features shared across projects, features that change over time and need point-in-time joins, or features that must be served online at low latency.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Entity key | Human | What a row is about: `customer_id`, `turbine_id`. Becomes the primary key. |
| Feature definitions | Human | The aggregations, in business terms. "Rolling 7-day average vibration per turbine." |
| Timestamp column | Human | Required if features change over time. Without it, point-in-time joins are impossible. |
| Source table | You derive | A silver table |
| Target catalog and schema | You derive | The bundle's `catalog` variable |
| Online serving needed? | Human | Only if a real-time endpoint will read these features. Adds a Lakebase online store. |

:::danger
If the features change over time and there is no timestamp column, stop and ask for one.
Joining a label from January against a feature computed in June trains the model on information that did not exist at prediction time.
The metrics look excellent and the model is worthless.
:::

## Two approaches

| Approach | Use when |
|---|---|
| **Feature table with `FeatureLookup`** | Features are computed by a pipeline or job and written to a Unity Catalog table. The training set declares lookups, and the model records the lineage. |
| **Declarative Feature Views** | The feature logic itself should be declarative: `create_feature`, `DeltaTableSource`, and window specs (`RollingWindow`, `SlidingWindow`, `TumblingWindow`), materialized with `materialize_features`. Also covers streaming features from Kafka. |

Read the skill's feature-engineering section for the exact API of whichever you pick.
Do not mix them for the same feature.

## Run

### 1. Confirm the source is populated at prediction time

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS rows, count(DISTINCT <entity_key>) AS entities, min(<ts_col>) AS earliest, max(<ts_col>) AS latest FROM <catalog>.<project>_silver.<source>",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

A `latest` well behind today means scoring will run on stale features.
Fix the upstream pipeline before building on it.

### 2. Write the feature computation as a notebook, run as a job

The feature table is written by Databricks compute, not from your local process.
Same rule as training.

```yaml
# resources/<project>_features.job.yml
resources:
  jobs:
    <project>_features:
      name: ${bundle.name}-features
      parameters:
        - name: catalog
          default: ${var.catalog}
        - name: schema
          default: ${var.schema_prefix}_gold
      tasks:
        - task_key: build_features
          notebook_task:
            notebook_path: ../src/ml/build_features.py
```

Schedule it, or chain it ahead of training in [11. Orchestration](/docs/11-orchestration).
Features that go stale silently are worse than features that fail loudly.

### 3. Deploy and run against dev

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
databricks bundle run <project>_features --target dev --profile <name>
```

## Verify

```bash
# The feature table exists with the primary key set
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "DESCRIBE EXTENDED <catalog>.<project>_gold.<entity>_features",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[] | @tsv' | grep -iE 'primary|constraint|Type'
```

Expect a primary key constraint on the entity key, and on the timestamp too if this is a time series feature table.
Without the constraint, `FeatureLookup` cannot resolve the join.

One row per entity per timestamp, which is the check that catches a fan-out:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) - count(DISTINCT <entity_key>, <ts_col>) AS dupes FROM <catalog>.<project>_gold.<entity>_features",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0][0]'
```

Expect `0`.

Null coverage per feature, since a feature that is 90% null will not carry signal:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS rows, count(<feature_1>) AS nn_1, count(<feature_2>) AS nn_2 FROM <catalog>.<project>_gold.<entity>_features",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

Report the coverage rather than silently training on mostly-null columns.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `FeatureLookup` cannot resolve | No primary key constraint on the feature table | Add the constraint. It is not optional for lookups. |
| Duplicate rows per entity | Aggregation grain is wrong, or the source fans out | Re-check the grain, as in [7. Query and explore](/docs/07-query-and-explore#3-is-the-grain-what-you-think-it-is) |
| Training metrics excellent, production predictions poor | Label leakage: features computed after the label window opened | Use point-in-time joins with the timestamp column |
| Scoring fails on missing features | Feature job runs after the scoring job | Chain them in one job. See [11. Orchestration](/docs/11-orchestration). |
| Real-time endpoint cannot read features | No online store | Add a Lakebase online store. See the skill's feature-engineering section. |

## Next

- **Do next:** [Train and register](/docs/09-predictive-analytics/train-and-register)
- **Reference:** [Feature engineering in Unity Catalog](https://docs.databricks.com/aws/en/machine-learning/feature-store/)
