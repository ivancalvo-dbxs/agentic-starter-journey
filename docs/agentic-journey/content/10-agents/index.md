---
sidebar_position: 0
sidebar_label: 10. Agents
description: Vector search indexes, Agent Bricks Knowledge Assistants and Supervisor Agents, and MLflow evaluation.
---

# 10. Agents

**Goal:** a working agent surface over the project's data, with an evaluation loop that can tell whether a change made it better.

**Prerequisites:** [7. Query and explore](/docs/07-query-and-explore) complete. For document Q&A, source documents in a Unity Catalog volume.

## Which agent surface

Four surfaces, and the choice follows from what the data is.
Picking the wrong one produces something that works badly rather than something that fails.

| The data is | Build | Skill | Page |
|---|---|---|---|
| SQL tables and metric views | Genie Agent | `databricks-genie-agents` | Already covered in [8. Genie Agents](/docs/08-unified-analytics/genie-agents) |
| Documents: PDFs, text in a volume | Knowledge Assistant | `databricks-agent-bricks` | [Agent Bricks](/docs/10-agents/agent-bricks) |
| Both, or several agents to route between | Supervisor Agent | `databricks-agent-bricks` | [Agent Bricks](/docs/10-agents/agent-bricks) |
| Text needing semantic retrieval inside custom code | Vector search index | `databricks-vector-search` | [Vector search](/docs/10-agents/vector-search) |

For a structured-data question, the answer is a Genie Agent, and that is in section 8 because it belongs next to the metric views it reads.
Do not build a RAG pipeline over a Delta table that a Genie Agent can already query.

## In this section

| Page | Skill | Produces |
|---|---|---|
| [Vector search](/docs/10-agents/vector-search) | `databricks-vector-search` | An endpoint and a Delta-synced index for retrieval |
| [Agent Bricks](/docs/10-agents/agent-bricks) | `databricks-agent-bricks` | A Knowledge Assistant over documents, or a Supervisor Agent routing between agents |
| [Evaluation](/docs/10-agents/evaluation) | `databricks-mlflow-evaluation` | Scorers, an eval dataset, and production trace monitoring |

Evaluation is not optional at the end.
An agent without a scored eval set cannot be improved, only fiddled with: every prompt change is a guess whose effect nobody measured.

## Custom agent code

For an agent authored in code rather than assembled from Agent Bricks tiles, `databricks-ml-training` covers custom `ResponsesAgent` authoring, including LangGraph with Unity Catalog functions and vector search as tools.
`databricks-model-serving` deploys it.

This journey does not walk that path.
It is a larger build than the sections above, and the Agent Bricks route covers the common cases without writing an orchestration layer.
Reach for custom code when the user needs control that the tiles do not give.

## Inputs shared across the section

| Input | Source | How to obtain |
|---|---|---|
| What users will ask | Human | Real questions. Drives the surface choice, the scope, and the eval set. |
| Source data location | Human | Volume path for documents, table name for structured data |
| Quality bar | Human | What a good answer looks like, and what an unacceptable one looks like. Becomes the scorers. |
| Who uses it | Human | Account-level groups |
| Catalog and schema | You derive | The bundle's `catalog` variable |

:::warning
This section was not specified in the source plan; its scope and page split are a judgement call, made from what the two skill libraries actually cover.
Genie Agents live in section 8 rather than here because they read the metric views built there.
:::

## Next

- **Do next:** [Vector search](/docs/10-agents/vector-search)
- **Reference:** [Agent Bricks](https://docs.databricks.com/aws/en/generative-ai/agent-bricks/)
