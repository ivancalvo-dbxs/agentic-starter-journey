---
sidebar_label: Vector search
description: Create a vector search endpoint and a Delta-synced index for retrieval.
---

# Vector search

**Goal:** a vector search index over the project's text, kept in sync with its Delta source, returning relevant results for real queries.

**Skill:** `databricks-vector-search` (databricks-agent-skills).

**Prerequisites:** a Delta table holding the text to search, with a primary key.

Build this when custom code needs semantic retrieval.
A Knowledge Assistant can consume an index you build here, but it can also read a volume path directly, so do not build an index the Knowledge Assistant does not need.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Source table and text column | You derive | The Delta table holding the text. Confirm the text column is populated. |
| Primary key column | You derive | Required for a Delta-synced index |
| Endpoint type | Human, with your recommendation | Standard or storage-optimized. See the table below. |
| Embedding model | Human, or you propose | A Databricks-hosted embedding model, or bring your own vectors |
| Expected corpus size | Human | Drives the endpoint type choice |
| Latency requirement | Human | Also drives the endpoint type choice |
| Filters needed at query time | Human | Metadata columns to filter on, for example tenant or document type |

## Endpoint type

One decision, and it is a 7x cost difference.

| Type | Latency | Capacity at 768 dimensions | Cost | Use for |
|---|---|---|---|---|
| Standard | 20 to 50ms | 320M vectors | Higher | Real-time, latency-sensitive |
| Storage-optimized | 300 to 500ms | 1B or more vectors | About 7x lower | Large corpora, cost-sensitive, latency tolerant |

Recommend storage-optimized unless the user names a latency budget below roughly 300ms.
A batch enrichment job or an internal Q&A tool does not need standard.

## Index type

| Type | Embeddings | Sync | Use when |
|---|---|---|---|
| Delta Sync, managed embeddings | Databricks computes them | Automatic from the source table | The default. Text lives in Delta and changes. |
| Delta Sync, self-managed embeddings | You supply the vectors | Automatic from the source table | You need a specific embedding model not hosted on Databricks |
| Direct Access | You supply the vectors | Manual CRUD | No Delta source, or vectors arrive from outside |

Default to Delta Sync with managed embeddings.
It keeps the index current without a job to maintain, which is the failure mode of a hand-synced index.

## Run

### 1. Confirm the source

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS rows, count(<text_col>) AS non_null_text, round(avg(length(<text_col>))) AS avg_chars, max(length(<text_col>)) AS max_chars FROM <catalog>.<schema>.<source>",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

Check `avg_chars`.
Rows that are whole documents rather than passages retrieve badly, because the embedding averages away the specific content.
Chunk them in the pipeline first if `avg_chars` is in the tens of thousands.

Change Data Feed is required on the source for a Delta-synced index:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "ALTER TABLE <catalog>.<schema>.<source> SET TBLPROPERTIES (delta.enableChangeDataFeed = true)",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

### 2. Create the endpoint and index

Invoke `databricks-vector-search` with the source table, text column, primary key, endpoint type, and any filter columns.

Endpoint creation takes a few minutes, and the initial index sync scales with corpus size.

### 3. Bundle resource

`vector_search_endpoint` and index resources are bundle-declarable.
See the [`vector_search_product_discovery` bundle example](https://github.com/databricks/bundle-examples/tree/main/knowledge_base/vector_search_product_discovery) for the resource shape, and keep the definition in `resources/` like every other asset.

## Verify

```bash
# Endpoint is ONLINE
databricks vector-search-endpoints get-endpoint <endpoint-name> --profile <name> -o json \
  | jq '{name, type: .endpoint_type, state: .endpoint_status.state}'

# Index is ONLINE and has indexed the rows you expect
databricks vector-search-indexes get-index <catalog>.<schema>.<index> --profile <name> -o json \
  | jq '{name, state: .status.detailed_state, indexed: .status.indexed_row_count, ready: .status.ready}'
```

Expect `ONLINE` on both, `ready: true`, and `indexed_row_count` matching the source row count.
A count well below the source means the sync is still running, so wait rather than declaring it broken.

Then query it, which is the only check that shows whether retrieval is any good:

```bash
databricks vector-search-indexes query-index <catalog>.<schema>.<index> \
  --columns '<pk>,<text_col>' \
  --query-text "<a real question a user would ask>" \
  --num-results 5 --profile <name> -o json \
  | jq -r '.result.data_array[] | @tsv'
```

Read the results.
Five rows that do not answer the question means the index is working and the retrieval is not, which is a chunking or embedding problem, not an infrastructure one.
Try three or four real questions before calling this done.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Index creation rejected | Change Data Feed not enabled on the source | `ALTER TABLE ... SET TBLPROPERTIES (delta.enableChangeDataFeed = true)` |
| Index stuck below the source row count | Initial sync still running | Wait. Large corpora take a while. |
| Results are irrelevant | Rows are whole documents, not passages | Chunk in the pipeline, then re-index |
| Results ignore recent additions | Direct Access index, no sync | Use Delta Sync, or run the CRUD updates |
| Query latency higher than expected | Storage-optimized endpoint | Expected at 300 to 500ms. Move to standard only if the budget requires it. |
| Filter has no effect | Filter column not included in the index | Recreate the index with the metadata columns included |
| `PERMISSION_DENIED` on query | Caller lacks `SELECT` on the source table | Grant it. Index permissions do not replace table grants. |

## Next

- **Do next:** [Agent Bricks](/docs/10-agents/agent-bricks)
- **Reference:** [Vector Search](https://docs.databricks.com/aws/en/generative-ai/vector-search)
