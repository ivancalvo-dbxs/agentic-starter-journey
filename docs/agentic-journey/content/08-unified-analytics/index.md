---
sidebar_position: 0
sidebar_label: 8. Unified analytics
description: Metric views, AI/BI dashboards, and Genie Agents as bundle resources on top of the gold tables.
---

# 8. Unified analytics

**Goal:** KPIs defined once as metric views, with a dashboard and a Genie Agent reading them, all defined in the project bundle.

**Prerequisites:** [7. Query and explore](/docs/07-query-and-explore) complete, so the grain and the candidate measures of each gold table are known.

Define the metric first, then point the consumers at it.
A dashboard and a Genie Agent that each carry their own copy of the revenue formula will disagree eventually, and reconciling them means finding every place the formula was written.
One metric view, two consumers.

## What is DABs-deployable, and what is not

This distinction drives the order of the pages.

| Asset | Bundle resource | How it ships |
|---|---|---|
| AI/BI dashboard | `resources.dashboards` | Native. Declare it, `bundle deploy`. |
| Genie Agent | `resources.genie_spaces` | Native. Declare it with a serialized JSON definition, `bundle deploy`. |
| Metric view | None | Not a bundle resource type. It ships as a `CREATE OR REPLACE VIEW ... WITH METRICS` statement run by a SQL task, and that **job** is the bundle resource. |

So a metric view is still infrastructure as code and still version-controlled: the SQL lives in `src/`, the job that applies it lives in `resources/`, and `bundle deploy` plus `bundle run` registers it.
The indirection is one extra hop, not a manual step.

This is the pattern the official [`metric_view` bundle example](https://github.com/databricks/bundle-examples/tree/main/knowledge_base/metric_view) uses.

## In this section

| Order | Page | Skill | Produces |
|---|---|---|---|
| 1 | [Metric views](/docs/08-unified-analytics/metric-views) | `databricks-metric-views` | Governed KPIs over the gold tables, applied by a bundle job |
| 2 | [Dashboards](/docs/08-unified-analytics/dashboards) | `databricks-aibi-dashboards` | AI/BI dashboard as a bundle resource |
| 3 | [Genie Agents](/docs/08-unified-analytics/genie-agents) | `databricks-genie-agents` | Curated natural-language agent as a bundle resource |

Metric views first.
The dashboard and the Genie Agent should read them rather than the raw gold tables.

## Inputs shared across the section

| Input | Source | How to obtain |
|---|---|---|
| Business questions | Human | The actual questions to answer. Drives measures, dimensions, and Genie sample questions. |
| Warehouse ID | You derive | `databricks warehouses list -o json`. Add it as a bundle variable, not a literal. |
| Gold tables and their grain | You derive | The profile from [7. Query and explore](/docs/07-query-and-explore) |
| Who consumes this | Human | Groups that get `CAN_VIEW` or `CAN_RUN`. Account-level groups only. |

## Databricks Apps

For a custom interactive surface rather than a dashboard, `databricks-apps` (TypeScript, AppKit) and `databricks-apps-python` (Streamlit, Dash, FastAPI) build one, and `apps` is a bundle resource type.
This journey does not walk it: a plain "create a dashboard" request means an AI/BI dashboard, and that is what [Dashboards](/docs/08-unified-analytics/dashboards) covers.
Reach for the app skills only when the user asks for an application.

## Next

- **Do next:** [Metric views](/docs/08-unified-analytics/metric-views)
- **Reference:** [Unity Catalog metric views](https://docs.databricks.com/aws/en/metric-views/)
