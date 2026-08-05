---
sidebar_label: Train and register
description: Train with MLflow as a serverless bundle job and register the model to Unity Catalog with a prod alias.
---

# Train and register

**Goal:** a model trained on Databricks compute, tracked in MLflow, registered to Unity Catalog, with a `@prod` alias pointing at the version to consume.

**Skill:** `databricks-ml-training` (databricks-agent-skills).

**Prerequisites:** features available, either as silver columns or from [Feature tables](/docs/09-predictive-analytics/feature-tables).

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Label definition | Human | How the label is derived and from which table, including the time window |
| Feature set | Human, then verify | Columns or feature-table lookups. Confirm each is populated at prediction time. |
| Framework | Human, or you propose | XGBoost, sklearn, LightGBM, PyTorch. XGBoost is a reasonable default for tabular classification. |
| Primary metric | Human | What "better" means: AUC, precision at a threshold, RMSE. Needed for the Optuna objective. |
| Model name | You derive | `<catalog>.<schema>.<project>_<target>` |
| Experiment path | You derive | `/Users/<user>/<project>`. The parent folder must exist. |
| Tuning budget | Human | How many Optuna trials. Costs compute, so ask. |

## Two non-obvious setup steps

Both fail late and confusingly if missed.

```bash
# 1. The experiment's parent folder must exist. set_experiment does NOT create it,
#    it fails with NOT_FOUND: Parent directory does not exist.
databricks workspace mkdirs /Users/<user>/<project> --profile <name>
```

```python
# 2. Point MLflow at Unity Catalog. Without this, models land in the deprecated
#    workspace registry and nothing downstream in this journey can find them.
mlflow.set_registry_uri("databricks-uc")
```

## Run

### 1. Write the training notebook

Use Databricks notebook source format: a `# Databricks notebook source` header, `# COMMAND ----------` separators, and `# MAGIC %md` for markdown cells.

```python
# Databricks notebook source
# MAGIC %md
# MAGIC # <Project> <target> prediction

# COMMAND ----------

import mlflow, mlflow.xgboost, optuna
from mlflow.tracking import MlflowClient

mlflow.set_registry_uri("databricks-uc")
mlflow.set_experiment("/Users/<user>/<project>")
mlflow.autolog()

catalog = dbutils.widgets.get("catalog")
schema = dbutils.widgets.get("schema")
model_name = f"{catalog}.{schema}.<project>_<target>"
```

`mlflow.autolog()` captures params, metrics, code, and the artifact for every run.
Wrap training in Optuna so each trial is a child run and only the best one is registered.

Then set the alias, which is what every consumer resolves:

```python
client = MlflowClient()
version = client.get_model_version_by_alias  # after register_model returns a version
client.set_registered_model_alias(model_name, "prod", <version>)
```

Consumers reference `models:/<catalog>.<schema>.<model>@prod`, never a version number.
That is what makes promoting a new model a one-line alias move instead of a code change in every consumer.

### 2. Add the job

```yaml
# resources/<project>_training.job.yml
resources:
  jobs:
    <project>_training:
      name: ${bundle.name}-training
      parameters:
        - name: catalog
          default: ${var.catalog}
        - name: schema
          default: ${var.schema_prefix}_gold
      tasks:
        - task_key: train
          notebook_task:
            notebook_path: ../src/ml/train.py
```

Serverless by default.
Add a `job_cluster` only if the framework needs a GPU or a specific runtime.

### 3. Deploy and submit

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
databricks bundle run <project>_training --target dev --profile <name> --no-wait
```

`--no-wait` matters for a tuning run.
Training that outlives your session should not depend on your session.
Poll instead:

```bash
databricks jobs get-run <run-id> --profile <name> -o json \
  | jq -r '.state.life_cycle_state + " " + (.state.result_state // "")'
```

## Verify

```bash
# The model is registered in Unity Catalog, not the workspace registry
databricks api get "/api/2.1/unity-catalog/models/<catalog>.<schema>.<project>_<target>" \
  --profile <name> | jq '{full_name, owner}'

# A prod alias exists and points at a real version
databricks api get "/api/2.1/unity-catalog/models/<catalog>.<schema>.<project>_<target>" \
  --profile <name> | jq -r '.aliases[]? | "\(.alias_name) -> version \(.version_num)"'
```

Expect the full three-level name and `prod -> version N`.
A `RESOURCE_DOES_NOT_EXIST` here with a successful training run almost always means `set_registry_uri("databricks-uc")` was missing, so the model went to the workspace registry.

Then check the metrics are real, not just present:

```bash
databricks api post /api/2.0/mlflow/runs/search --profile <name> --json '{
  "experiment_ids": ["<experiment-id>"],
  "order_by": ["metrics.<primary_metric> DESC"],
  "max_results": 5
}' | jq -r '.runs[] | "\(.info.run_id)\t\(.data.metrics[] | select(.key=="<primary_metric>") | .value)"'
```

A metric suspiciously close to 1.0 on a real-world problem is a leakage signal, not a success.
Say so rather than reporting it as a win, and go back to the label definition.

Finally, load the aliased model and score a handful of rows:

```bash
databricks bundle run <project>_training --target dev --profile <name> 2>&1 | tail -5
```

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `NOT_FOUND: Parent directory does not exist` | Experiment folder missing | `databricks workspace mkdirs <path>` before the job runs |
| Model registered but nothing downstream finds it | `set_registry_uri("databricks-uc")` missing, so it went to the workspace registry | Add it and re-register |
| Training fails on missing tables | Ran locally instead of on Databricks | Submit as a job. Local has no access to silver tables. |
| Run dies mid-tuning | Session dropped and the run was attached to it | `databricks jobs submit --no-wait`, then poll |
| AUC near 1.0 | Label leakage | Re-check that every feature is computable before the label window opens |
| `PERMISSION_DENIED` registering | Caller lacks `CREATE MODEL` on the schema | Grant it, or register into a schema they own |
| Batch scoring returns wrong values | Model logged with `fe.log_model(training_set=...)` but scored with `spark_udf` | Use `fe.score_batch()`. See [Serving and batch](/docs/09-predictive-analytics/serving-and-batch). |

## Next

- **Do next:** [Serving and batch](/docs/09-predictive-analytics/serving-and-batch)
- **Manual fallback:** [Starter Journey: Save model to Unity Catalog](https://databricks-solutions.github.io/starter-journey/docs/10-predictive-analytics/save-model-to-unity-catalog)
- **Reference:** [Models in Unity Catalog](https://docs.databricks.com/aws/en/machine-learning/manage-model-lifecycle/)
