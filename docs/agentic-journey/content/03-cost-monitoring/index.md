---
sidebar_position: 0
sidebar_label: 3. Cost monitoring
description: Turn on cost visibility over the system tables before any workload exists.
---

# 3. Cost monitoring

**Goal:** consumption visible and attributable before anyone runs a pipeline.

**Prerequisites:** [2. Infra setup](/docs/02-infra-setup/) complete, so there are workspaces to bill against.

Do this now rather than later, for one mechanical reason: compute tags apply only to usage created after they are set.
Every day without tags is a day of spend that can never be attributed.
There is no retrofit.

## Where the numbers come from

Everything in this section reads the `system` catalog, which holds read-only billing and operations tables.

| Table | Holds |
|---|---|
| `system.billing.usage` | One row per billable usage record, with DBUs, SKU, workspace, and tags |
| `system.billing.list_prices` | List price per SKU over time, needed to turn DBUs into dollars |
| `system.access.audit` | Audit events, used by the access-auditing tiles |
| `system.compute.clusters` | Cluster configuration history |

Confirm the caller can read them before building anything on top:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS n FROM system.billing.usage WHERE usage_date >= current_date() - INTERVAL 7 DAYS",
  "wait_timeout": "30s"
}' | jq -r '.result.data_array[0][0]'
```

Expect an integer.
`0` on a new account is normal and means no usage yet, not a permission problem.
A `PERMISSION_DENIED` means an admin has to `GRANT SELECT ON SCHEMA system.billing TO <group>`.

## In this section

| Page | Skill | Produces |
|---|---|---|
| [Cost dashboards](/docs/03-cost-monitoring/cost-dashboards) | `databricks-execution-compute` | The packaged system-tables dashboards and Genie Agent running on real billing data |

## Tags and budgets

Two steps in this section have no agentic path worth wrapping.

**Compute and job tags** are set on the resources themselves, so they belong to the resource definition rather than to a separate step.
Set them in the bundle from [6. Build the first pipeline](/docs/06-build-first-pipeline/) onward: `tags` on a job, `custom_tags` on a cluster or SQL warehouse.
Those keys land in `system.billing.usage.custom_tags` and become the grouping column for every attribution query.
Agree the key set with the user before the first bundle ships, because renaming a key later splits the history.
Reference: [Starter Journey: Tags and attribution](https://databricks-solutions.github.io/starter-journey/docs/04-cost-monitoring/tag-compute-and-jobs).

**Budget alerts** are account-console configuration with an email target.
No skill in either library covers them.
Manual: [Starter Journey: Budget alerts](https://databricks-solutions.github.io/starter-journey/docs/04-cost-monitoring/budget-alerts).

## Next

- **Do next:** [Cost dashboards](/docs/03-cost-monitoring/cost-dashboards)
- **Reference:** [Monitor costs using system tables](https://docs.databricks.com/aws/en/admin/usage/system-tables)
