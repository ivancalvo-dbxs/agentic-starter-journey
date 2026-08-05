---
sidebar_label: Genie Agents
description: Create a curated Genie Agent as a bundle resource, scoped to the project's metric views and gold tables.
---

# Genie Agents

**Goal:** a Genie Agent deployed as a bundle resource, scoped to this project's data, answering the business questions from section 8's intake.

**Skill:** `databricks-genie-agents` (databricks-agent-skills).

**Prerequisites:** [Metric views](/docs/08-unified-analytics/metric-views) registered.

A Genie Agent is curated and scoped: its tables, sample questions, and instructions are authored for one business area.
That is different from the general "ask Genie" path used in [7. Query and explore](/docs/07-query-and-explore), which is `databricks-data-discovery` and answers across all data with no curation.
Build an agent here because the scoping is what makes the answers trustworthy.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Business area and title | Human | What this agent is for. One agent per business area, not one per workspace. |
| Tables and views in scope | You derive | The metric views, plus gold tables. Silver facts only if a question needs row-level detail. |
| Sample questions | Human, refined by you | Real questions users will ask. Verify each one against the data before shipping it. |
| Text instructions | Human | Business rules Genie cannot infer: which status codes count, what the fiscal year is, which column is authoritative when two look similar. |
| Warehouse ID | You derive | Bundle variable |
| User groups | Human | Account-level groups getting `CAN_RUN` |

Sample questions carry more weight than they look like they do.
They are how the agent learns the shape of a good answer, so a question that returns nothing teaches it the wrong pattern.
Run each one before shipping.

Scope tightly.
An agent pointed at every table in the catalog answers worse than one pointed at four well-understood tables, because it has more wrong joins available to it.

## Run

### 1. Probe the data behind each sample question

Cardinality of the dimensions, ranges of the measures, top categorical values.
Sample rows do not tell you whether "revenue by region last quarter" has data for every region.

Fan out independent probes rather than serializing them:

```bash
for q in \
  "SELECT count(DISTINCT region) FROM <catalog>.<project>_gold.orders_daily" \
  "SELECT min(order_date), max(order_date) FROM <catalog>.<project>_gold.orders_daily" \
  "SELECT status, count(*) FROM <catalog>.<project>_gold.orders_daily GROUP BY 1"
do
  databricks api post /api/2.0/sql/statements --profile <name> --json "$(jq -n \
    --arg w "<warehouse-id>" --arg s "$q" \
    '{warehouse_id:$w, statement:$s, wait_timeout:"50s"}')" \
    | jq -r '.result.data_array'
done
```

### 2. Write the serialized definition

Keep it in a local JSON file so it is version-controlled and diffable.

```text
src/<project>_genie.geniespace.json
```

It holds the data sources, text instructions, and sample questions.
Two shape requirements that fail late if missed: each sample question needs a 32-character hex `id`, and `question` is an array, not a string.

### 3. Add the resource

```yaml
# resources/<project>_genie.genie_space.yml
resources:
  genie_spaces:
    <project>_genie:
      title: "<Project> Analytics"
      description: "Ask questions about <project> orders in natural language"
      file_path: ../src/<project>_genie.geniespace.json
      warehouse_id: ${var.warehouse_id}
      permissions:
        - level: CAN_RUN
          group_name: <business-users-group>
```

`parent_path` defaults to the bundle deployment root, which is usually right.
Set it only if the user wants the agent in a specific workspace folder, and note that a `parent_path` you set must already exist or the deploy fails with `Tree node with path ... does not exist`.

### 4. Deploy to dev

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
```

## Verify

```bash
# The agent exists
databricks genie list-spaces --profile <name> -o json \
  | jq -r '.spaces[] | select(.title | test("<Project>")) | "\(.space_id)\t\(.title)"'

# Its scope is what you authored
databricks genie get-space <space-id> --include-serialized-space --profile <name> -o json \
  | jq -r '.serialized_space | fromjson | {tables: [.data_sources[]?.table_full_name?], questions: [.sample_questions[]?.question?]}'
```

Then ask it a question, which is the only check that proves it works:

```bash
databricks genie create-message-and-wait <space-id> \
  --content "What was total revenue by month last quarter?" \
  --profile <name> -o json \
  | jq -r '.attachments[]? | (.text.content // .query.query)'
```

Expect either a text answer or generated SQL that reads the metric view.
If the generated SQL re-derives revenue from the raw table instead of calling `MEASURE()`, the metric view is not in scope or the instructions do not point at it.
Fix that before shipping: an agent that bypasses the metric view will disagree with the dashboard.

Run every sample question this way.
Any that error or return nothing should be rewritten or removed.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `Tree node with path ... does not exist` | `parent_path` set to a folder that does not exist | `databricks workspace mkdirs <path>` first, or drop `parent_path` and take the default |
| Create fails on `sample_questions` | Missing the 32-char hex `id`, or `question` given as a string | Add the `id`; make `question` an array |
| Answers ignore the metric views | Metric views not in the data sources, or no instruction to prefer them | Add them to scope and say so in the text instructions |
| Answers are confidently wrong | Scope too broad, so Genie has wrong joins available | Cut the table list to what the questions need |
| A sample question returns nothing | The question does not match the data, for example a status value that does not exist | Probe the data, then rewrite the question |
| Users get a permission error | `CAN_RUN` granted but no Unity Catalog `SELECT` on the tables | Grant both. They are separate planes. |

## Next

- **Do next:** [9. Predictive analytics](/docs/09-predictive-analytics/)
- **Manual fallback:** [Starter Journey: Genie spaces](https://databricks-solutions.github.io/starter-journey/docs/09-unified-analytics/databricks-aibi/genie-spaces)
- **Reference:** [Genie](https://docs.databricks.com/aws/en/genie/), [Genie space bundle example](https://github.com/databricks/bundle-examples/tree/main/knowledge_base/genie_space_nyc_taxi)
