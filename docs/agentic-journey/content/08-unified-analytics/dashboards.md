---
sidebar_label: Dashboards
description: Build an AI/BI dashboard as a bundle resource, with every query validated before deploy.
---

# Dashboards

**Goal:** an AI/BI dashboard deployed as a bundle resource, reading the metric views.

**Skill:** `databricks-aibi-dashboards` (databricks-agent-skills). Its dashboards are a specific JSON structure, so do not hand-write the file from the API docs.

**Prerequisites:** [Metric views](/docs/08-unified-analytics/metric-views) registered and reconciled.

:::warning
Test every SQL query against the warehouse before deploying the dashboard.
The skill requires this, and the reason is mechanical: a dashboard with a broken query deploys successfully and fails per widget at view time, so the deploy tells you nothing.
:::

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Questions each page answers | Human | "Revenue trend by month", "top regions this quarter". One dashboard page per audience, not one page per table. |
| Data source | You derive | The metric views from the previous page, not the raw gold tables |
| Filters users need | Human | Date range, region, product line. These become dashboard filter widgets. |
| Warehouse ID | You derive | Bundle variable |
| Viewer groups | Human | Account-level groups getting `CAN_VIEW` |

Point the widgets at the metric views.
A dashboard that re-derives revenue in its own query is a second definition of revenue, which is the thing section 8 exists to prevent.

## Run

### 1. Validate every query first

For each widget query:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT `Order Month`, MEASURE(`Total Revenue`) AS revenue FROM <catalog>.<project>_gold.<project>_kpis GROUP BY ALL ORDER BY ALL",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

Expect `SUCCEEDED` for every one.
Fix the failures now, in a two-second feedback loop, rather than after a deploy.

### 2. Write the dashboard file

Invoke `databricks-aibi-dashboards` with the validated queries and the page layout.
It generates the `.lvdash.json` structure.

### 3. Add the resource

```yaml
# resources/<project>_analytics.dashboard.yml
resources:
  dashboards:
    <project>_analytics:
      display_name: "<Project> Analytics"
      file_path: ../src/<project>_analytics.lvdash.json
      warehouse_id: ${var.warehouse_id}
      permissions:
        - level: CAN_VIEW
          group_name: <data-analysts-group>
```

### 4. Deploy to dev

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
```

Dashboards need no `bundle run`; deploying registers them.

## Verify

```bash
# The dashboard exists and is published against the right warehouse
databricks lakeview list --profile <name> -o json \
  | jq -r '.[] | select(.display_name | test("<Project>")) | "\(.dashboard_id)\t\(.display_name)\t\(.warehouse_id)"'
```

Then confirm each dataset in the deployed file still runs, since the deployed copy is what users see:

```bash
databricks lakeview get <dashboard-id> --profile <name> -o json \
  | jq -r '.serialized_dashboard | fromjson | .datasets[] | .name'
```

Expect the dataset names you authored.
Re-run each dataset's query through the statement API if the dashboard was edited after the queries were validated.

Permissions:

```bash
databricks api get /api/2.0/permissions/dashboards/<dashboard-id> --profile <name> \
  | jq -r '.access_control_list[] | "\(.group_name // .user_name)\t\(.all_permissions[0].permission_level)"'
```

Expect the analyst group with `CAN_VIEW`, and no individual users.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Dashboard deploys, widgets show errors | Queries never validated | Run every query through the statement API before deploying |
| `SELECT *` fails against a metric view | Not supported | Name dimensions, wrap measures in `MEASURE()` |
| Widget empty but the query works standalone | Dashboard filter defaults exclude all rows | Check the filter widget's default value against the data's date range |
| Numbers differ from the metric view | Widget query re-derives the metric instead of reading the view | Point it at the metric view |
| Viewers get a permission error | `CAN_VIEW` on the dashboard but no `SELECT` on the underlying tables | Dashboard permissions and Unity Catalog grants are separate. Grant both. |
| Deploy fails on the JSON structure | Hand-written dashboard file | Regenerate through the skill |

## Next

- **Do next:** [Genie Agents](/docs/08-unified-analytics/genie-agents)
- **Manual fallback:** [Starter Journey: Dashboards](https://databricks-solutions.github.io/starter-journey/docs/09-unified-analytics/databricks-aibi/dashboards)
- **Reference:** [AI/BI dashboards](https://docs.databricks.com/aws/en/dashboards/), [dashboard bundle example](https://github.com/databricks/bundle-examples/tree/main/knowledge_base/dashboard_nyc_taxi)
