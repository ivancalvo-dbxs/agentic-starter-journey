---
sidebar_label: Cost dashboards
description: Run the packaged system-tables notebook to create cost dashboards on real billing data.
---

# Cost dashboards

**Goal:** the packaged system-tables dashboards and Genie Agent installed in the workspace, reading the account's own billing data.

**Skill:** `databricks-execution-compute` (databricks-agent-skills), to run the notebook on serverless.

**Prerequisites:** [3. Cost monitoring](/docs/03-cost-monitoring/) permission check passing, and a catalog and schema where the caller can create tables.

This step installs a community package that generates dashboards, notebooks, and a Genie Agent from the system tables.
It is the same package the human journey uses, driven from the CLI instead of pasted into a notebook cell by hand.

Source page, which is the authority on the current package name and contents: [Starter Journey: Additional dashboards](https://databricks-solutions.github.io/starter-journey/docs/04-cost-monitoring/additional-dashboards).

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Target catalog | Human | A catalog where they can create tables. Does not have to be `main`. If section 4 already ran, use a catalog from there. |
| Target schema | Human | A schema in that catalog. The installer creates it if absent. |
| Compute | You derive | Serverless notebook compute. No cluster needed. |
| Warehouse ID | You derive | `databricks warehouses list -o json`, for the verification query |

Confirm the catalog and schema before running.
The installer writes intermediate tables into them, so a wrong answer here scatters tables into someone else's catalog.

## Run

The package installs from a notebook, because its installer calls `dbutils`.
Write the notebook, then run it as a one-off serverless job rather than asking the user to paste cells.

```python
# cost_dashboards_install.py  (Databricks notebook source)
%pip install dbdemos
```

```python
dbutils.library.restartPython()
```

```python
import dbdemos

dbdemos.install(
    "uc-04-system-tables",
    catalog="<catalog>",
    schema="<schema>",
)
```

Submit it:

```bash
databricks workspace import /Users/<me>/cost_dashboards_install \
  --file cost_dashboards_install.py --language PYTHON --format SOURCE --profile <name>

databricks jobs submit --profile <name> --json '{
  "run_name": "install-cost-dashboards",
  "tasks": [{
    "task_key": "install",
    "notebook_task": {"notebook_path": "/Users/<me>/cost_dashboards_install"}
  }]
}' -o json | jq -r '.run_id'
```

Poll until terminal:

```bash
databricks jobs get-run <run-id> --profile <name> -o json \
  | jq -r '.state.life_cycle_state + " " + (.state.result_state // "")'
```

The run needs internet egress to PyPI.
On a workspace with no egress the `%pip install` fails; report that rather than retrying.

:::warning
The package name has drifted before.
If `dbdemos.install` reports an unknown demo, check the current name on the [source page](https://databricks-solutions.github.io/starter-journey/docs/04-cost-monitoring/additional-dashboards) or in [dbdemos](https://github.com/databricks-demos/dbdemos) instead of guessing a variant.
:::

## Verify

```bash
# Dashboards exist
databricks lakeview list --profile <name> -o json \
  | jq -r '.[] | select(.display_name | test("System|Usage|Billing"; "i")) | .display_name'

# Genie Agent exists
databricks api get /api/2.0/genie/spaces --profile <name> \
  | jq -r '.spaces[]? | .title'

# Intermediate tables landed
databricks tables list --catalog <catalog> --schema <schema> --profile <name> -o json \
  | jq -r '.[] | .name'
```

Expect at least one dashboard whose name matches the billing set, a Genie Agent title, and tables in the target schema.

Then confirm a tile actually returns rows rather than just existing:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT sku_name, round(sum(usage_quantity), 2) AS dbus FROM system.billing.usage WHERE usage_date >= current_date() - INTERVAL 30 DAYS GROUP BY 1 ORDER BY 2 DESC LIMIT 5",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array'
```

An empty array on a new account is expected.
Say so rather than reporting a broken install: forecast tiles stay thin until enough daily usage accumulates.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: dbdemos` | `restartPython()` not called after `%pip install` | Keep the three cells in order and in one notebook |
| `PERMISSION_DENIED` writing the schema | Caller cannot create tables in the target catalog | Pick a catalog they own, or ask an admin for `CREATE` |
| `PERMISSION_DENIED` on `system.billing` | No grant on the system schema | An admin runs `GRANT SELECT ON SCHEMA system.billing TO <group>`, plus `system.access` for the audit tiles |
| Install hangs at `%pip install` | No PyPI egress from the workspace | Report it. This needs a network change, not a retry. |
| Dashboards present, all charts empty | New account, no usage history | Expected. Re-check after a week of activity. |

## Next

- **Do next:** [4. Data governance strategy](/docs/04-data-governance-strategy/)
- **Reference:** [Billable usage system table](https://docs.databricks.com/aws/en/admin/system-tables/billing)
