---
sidebar_position: 0
sidebar_label: 9. Predictive analytics
description: Feature tables, MLflow training notebooks, models in Unity Catalog, and serving, each as a bundle resource.
---

# 9. Predictive analytics

**Goal:** a model trained on Databricks, registered in Unity Catalog, and consumed either as a batch score or a serving endpoint, all defined in the project bundle.

**Prerequisites:** [7. Query and explore](/docs/07-query-and-explore) complete. Silver tables exist with the features and labels.

## The canonical flow

One notebook, one artifact.
Re-running the notebook is retraining.

```text
silver_<features>  +  silver_<labels>
        │
        ▼
  notebook, run as a serverless job:
  ├── train with mlflow.autolog (XGBoost, sklearn, LightGBM, PyTorch)
  ├── mlflow.register_model → <catalog>.<schema>.<model>
  ├── set_registered_model_alias(name, "prod", version)
  └── score the latest features → MERGE into gold_<entity>_predictions
        │
        ▼
gold_<entity>_predictions  ◄── dashboards, Genie, and apps read this
```

Gold is where the truth lives.
Read paths never call the model directly, they read the predictions table.
That is what keeps a dashboard from depending on an endpoint being warm.

:::warning
Always train on Databricks, as a serverless job or notebook.
Never in the local Python process you are running in.
Local training cannot reach the silver tables, has no MLflow tracking server, has no Unity Catalog registry path, and dies with the chat session.
Submit with `databricks jobs submit --no-wait` unless the user explicitly asks for local execution.
:::

## In this section

| Order | Page | Skill | Produces |
|---|---|---|---|
| 1 | [Feature tables](/docs/09-predictive-analytics/feature-tables) | `databricks-ml-training` | Unity Catalog feature tables, or Feature Views, with point-in-time correctness |
| 2 | [Train and register](/docs/09-predictive-analytics/train-and-register) | `databricks-ml-training` | Training notebook run as a bundle job, model registered to Unity Catalog with a `@prod` alias |
| 3 | [Serving and batch](/docs/09-predictive-analytics/serving-and-batch) | `databricks-model-serving` | Batch scores in a gold table, plus a serving endpoint if latency requires one |

Feature tables are optional.
Skip page 1 if the features are already columns on a silver table and no other project needs to reuse them; a feature table earns its keep when features are shared or when point-in-time joins matter.

## Which consumption path

Ask this before building anything, because it changes the deliverable.

| Need | Path | Page |
|---|---|---|
| Daily or hourly scores, read by dashboards, Genie, or an app | Batch. Score into a gold table. | [Serving and batch](/docs/09-predictive-analytics/serving-and-batch) |
| Score on a user action, sub-100ms (fraud at authorization, recommendation at page load) | Real-time serving endpoint | [Serving and batch](/docs/09-predictive-analytics/serving-and-batch#serving-endpoint) |

Default to batch.
An endpoint that exists because nobody asked the latency question is a cost with no consumer.

## Inputs shared across the section

| Input | Source | How to obtain |
|---|---|---|
| Prediction target | Human | What is being predicted, in business terms, and the time window ("failure within 7 days") |
| Label definition | Human | How the label is derived, and from which table. This is where most of the modelling risk lives, so get it precisely. |
| Feature columns | Human, then verify | Candidate features. Confirm they exist and are populated at prediction time. |
| Latency need | Human | Batch or real-time. Decides the consumption path. |
| Catalog and schema | You derive | The bundle's `catalog` variable. Models go in the gold or a dedicated ML schema. |
| MLflow experiment path | You derive | `/Users/<user>/<project>`. The parent folder must exist first. |

:::danger
A label that leaks future information produces a model with excellent metrics and no value.
When the label is "failure within 7 days", every feature must be computable strictly before that window opens.
Ask how each feature is timestamped, and use point-in-time joins if the features change over time.
:::

## Evaluation

For classical models, `mlflow.autolog()` captures metrics per run and the registered version carries them.
For GenAI agents, evaluation is a separate skill: `databricks-mlflow-evaluation`, covered in [10. Agents](/docs/10-agents/evaluation).

## Next

- **Do next:** [Feature tables](/docs/09-predictive-analytics/feature-tables)
- **Reference:** [MLflow on Databricks](https://docs.databricks.com/aws/en/mlflow/)
