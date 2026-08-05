---
sidebar_label: Serving and batch
description: Score into a gold predictions table, and add a real-time serving endpoint only when latency requires one.
---

# Serving and batch

**Goal:** predictions available to consumers, as rows in a gold table for the batch case or through a serving endpoint for the low-latency case.

**Skill:** `databricks-ml-training` for batch scoring. `databricks-model-serving` (databricks-agent-skills) for endpoint lifecycle.

**Prerequisites:** [Train and register](/docs/09-predictive-analytics/train-and-register) complete, with a `@prod` alias.

Default to batch.
Add an endpoint only when a specific user action needs a score inside 100ms.
An endpoint provisioned because nobody asked the latency question is compute billed continuously with no consumer.

## Batch scoring

Predictions land in `gold_<entity>_predictions`.
Dashboards, Genie, and apps read that table, never the model.
That decoupling is why a dashboard does not break when an endpoint is cold or a model version is mid-swap.

### Pick the scoring API

This is the one decision that produces wrong numbers rather than an error.

| The model was logged with | Score with |
|---|---|
| `mlflow.<flavor>.log_model(...)`, plain | `mlflow.pyfunc.spark_udf(model_uri)` over the feature dataframe |
| `fe.log_model(training_set=...)`, feature-store-backed | `fe.score_batch(model_uri, df=<keys only>)` |

`fe.score_batch` auto-joins the features using the model's registered feature lineage, so it takes keys only.
Passing a full feature dataframe to it, or using `spark_udf` on a feature-store-backed model, produces predictions that look plausible and are wrong.

### Run

```python
# src/ml/score_batch.py  (Databricks notebook source)
import mlflow

mlflow.set_registry_uri("databricks-uc")
model_uri = f"models:/{catalog}.{schema}.<project>_<target>@prod"

# Plain model:
predict = mlflow.pyfunc.spark_udf(spark, model_uri)
scored = features_df.withColumn("prediction", predict(*feature_cols))

# Then MERGE into the gold predictions table rather than overwriting,
# so history survives and downstream incremental reads keep working.
```

Reference the model by alias, never by version number.
Promoting a new model then becomes an alias move, with no change to this file.

```yaml
# resources/<project>_scoring.job.yml
resources:
  jobs:
    <project>_scoring:
      name: ${bundle.name}-scoring
      parameters:
        - name: catalog
          default: ${var.catalog}
        - name: schema
          default: ${var.schema_prefix}_gold
      schedule:
        quartz_cron_expression: "0 0 6 * * ?"
        timezone_id: UTC
      tasks:
        - task_key: score
          notebook_task:
            notebook_path: ../src/ml/score_batch.py
```

Chain feature building ahead of scoring rather than scheduling them independently.
Two schedules that drift produce scores computed on stale features, silently.
See [11. Orchestration](/docs/11-orchestration).

### Verify

```bash
databricks bundle deploy --target dev --profile <name>
databricks bundle run <project>_scoring --target dev --profile <name>
```

```bash
# Predictions landed, one per entity, and they are fresh
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS rows, count(DISTINCT <entity_key>) AS entities, max(scored_at) AS latest FROM <catalog>.<project>_gold.<entity>_predictions",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

Expect `rows` equal to `entities` for a one-score-per-entity table, and `latest` at today.

Then check the distribution, because a scoring job can succeed and still produce a degenerate output:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT round(min(prediction),4) AS lo, round(avg(prediction),4) AS mean, round(max(prediction),4) AS hi, count(DISTINCT prediction) AS distinct_vals FROM <catalog>.<project>_gold.<entity>_predictions",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

`distinct_vals` of 1 means every entity got the same score.
The job passed, the model is useless, and only this check catches it.

## Serving endpoint

Only when a user action needs a score in real time.

**Skill:** `databricks-model-serving`. It covers endpoint CRUD, traffic routing for A/B and canary deploys, zero-downtime version swaps, OpenAPI schema retrieval, logs and metrics, and AI Gateway rate limits.

### Inputs

| Input | Source | How to obtain |
|---|---|---|
| Latency requirement | Human | The actual number. "Fast" is not a spec. |
| Expected QPS | Human | Drives sizing and scale-to-zero. |
| Scale to zero? | Human | Yes for intermittent traffic, at the cost of cold-start latency on the first request. |
| Feature source at inference | You derive | If the model is feature-store-backed, the endpoint needs a Lakebase online store |
| Model URI | You derive | `models:/<catalog>.<schema>.<model>@prod` |

```yaml
# resources/<project>_endpoint.yml
resources:
  model_serving_endpoints:
    <project>_endpoint:
      name: ${bundle.name}-endpoint
      config:
        served_entities:
          - entity_name: ${var.catalog}.${var.schema_prefix}_gold.<project>_<target>
            entity_version: "1"
            workload_size: Small
            scale_to_zero_enabled: true
```

Bundle-declared served entities take a version rather than an alias, so a promotion is a bundle change plus deploy, or a traffic-config update through the skill.
Say which one the user is choosing.

### Verify

```bash
# Endpoint is READY, not just created
databricks serving-endpoints get ${bundle.name}-endpoint --profile <name> -o json \
  | jq '{name, state: .state.ready, config_update: .state.config_update}'

# It returns a real prediction
databricks serving-endpoints query ${bundle.name}-endpoint --profile <name> --json '{
  "dataframe_records": [{"<feature_1>": <value>, "<feature_2>": <value>}]
}' | jq -r '.predictions'
```

Expect `READY` and a prediction array.
A `NOT_READY` with `config_update: IN_PROGRESS` means wait; provisioning takes several minutes.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Batch predictions plausible but wrong | `spark_udf` used on a feature-store-backed model | Use `fe.score_batch()` with keys only |
| Every prediction identical | Model collapsed, or a feature column arrived all-null | Check null coverage on the scoring input |
| Scores computed on stale features | Feature job and scoring job on independent schedules | Chain them in one job |
| Endpoint stuck `NOT_READY` | Still provisioning, or the model has an unsatisfiable dependency | Check `state.config_update`, then the build logs through the skill |
| First request after idle is slow | Scale-to-zero cold start | Expected. Disable scale-to-zero if the latency budget cannot absorb it. |
| Endpoint cannot find features | Feature-store-backed model with no online store | Add a Lakebase online store |
| Promotion did not take effect | Bundle pins `entity_version`, and only the alias moved | Update the version in the bundle and redeploy, or change traffic config |

## Next

- **Do next:** [10. Agents](/docs/10-agents/)
- **Manual fallback:** [Starter Journey: Batch inference](https://databricks-solutions.github.io/starter-journey/docs/10-predictive-analytics/batch-inference)
- **Reference:** [Model serving](https://docs.databricks.com/aws/en/machine-learning/model-serving/)
