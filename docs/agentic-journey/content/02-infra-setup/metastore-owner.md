---
sidebar_label: Metastore owner
description: Transfer Unity Catalog metastore ownership from an individual to the admin group.
---

# Metastore owner

**Goal:** the Unity Catalog metastore owned by a group, not by a person or a deployment service principal.

**Skill:** `databricks-unity-catalog-setup` (ai-platform-kit).

**Prerequisites:** [Create groups](/docs/02-infra-setup/create-groups) complete, so an admin group exists to receive ownership.

Whoever created the metastore owns it. That is usually the human who ran the first deploy or the Terraform service principal. Either way, governance operations stop the day that identity is deleted or leaves, and only the current owner or an account admin can transfer ownership. Fix it now, while the fix is one API call.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Metastore ID | You derive | `databricks account metastores list` |
| Target owner group | Human | The admin group from the previous page, usually `platform-admins` or `metastore-admins`. Confirm the exact display name. |
| Auto-assign new workspaces? | Human | Whether new workspaces in the region attach to this metastore automatically. Default yes. |
| Delta Sharing? | Human | Optional. Only enable if they have a sharing use case. |

## Run

### 1. Find the metastore and read the current owner

```bash
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, owner}'
```

If `owner` is already the target group, stop. Report it and move on.

### 2. Confirm the group exists

```bash
databricks account groups list --profile <name>-account -o json \
  | jq -r '.[] | select(.displayName=="<group>") | .displayName'
```

Transferring to a group that does not exist fails, or worse, silently sets a name nothing resolves to.

### 3. Transfer ownership

```bash
databricks account metastores update <metastore-id> \
  --profile <name>-account \
  --json '{"owner": "<group>"}'
```

### 4. Metastore settings

Auto-assignment for new workspaces and Delta Sharing are separate settings on the same object. Ask before changing either; neither is required for the rest of the journey.

## Verify

```bash
databricks account metastores get <metastore-id> --profile <name>-account -o json \
  | jq '{name, owner, delta_sharing_scope}'
```

Expect `owner` to be the group display name. If it comes back as an email address or an application ID, the transfer did not take.

Cross-check that the group can actually act on the metastore:

```bash
databricks grants get METASTORE <metastore-id> --profile <name> -o json \
  | jq -r '.privilege_assignments[]? | "\(.principal)\t\(.privileges | join(","))"'
```

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `PERMISSION_DENIED` on update | Caller is neither the current owner nor an account admin | Use an account-admin identity. If the current owner has left the organization, this needs Databricks support. |
| Owner set but nothing resolves | Group name typo, or the group is workspace-local | Compare against `databricks account groups list` output exactly, including case |
| Catalogs still owned by the service principal | Metastore ownership does not cascade to objects the SP created | Transfer or grant per object. See the SP-ownership rule in [Create groups](/docs/02-infra-setup/create-groups#hard-rules-the-skill-enforces). |
| Several metastores in the region | Orphans from earlier deploys | Confirm which one the workspaces are attached to before transferring. Do not transfer an orphan. |

## Next

- **Do next:** [3. Cost monitoring](/docs/03-cost-monitoring/)
- **Manual fallback:** [Starter Journey: Set admin group](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/metastore-admins/set-admin-group)
- **Reference:** [Manage Unity Catalog privileges](https://docs.databricks.com/aws/en/data-governance/unity-catalog/manage-privileges/)
