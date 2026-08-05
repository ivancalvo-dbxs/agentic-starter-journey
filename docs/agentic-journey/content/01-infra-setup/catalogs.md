---
description: Pick a catalog layout and create the catalogs with medallion schemas and group grants using databricks-unity-catalog-setup.
---

# Catalogs

## Mental Model

A catalog is the isolation boundary for data. Its layout determines every table name in the account, and changing it after a few hundred tables exist means rewriting every query that references them, so in practice it never gets changed.
Databricks creates catalogs through Terraform via `databricks-unity-catalog-setup`, which writes the storage, credential, external location, catalog, schemas, and grants in one apply.
One dedicated bucket or container per catalog is non-negotiable: shared storage breaks blast-radius isolation.

## Goal

One catalog per environment, each backed by its own object storage, with medallion schemas and schema-level group grants.

## Prerequisites

- [Workspaces](/docs/01-infra-setup/workspaces/) complete, with a metastore in the region.
- Account-level groups exist. Unity Catalog cannot see workspace-local groups.

## Skill

`databricks-unity-catalog-setup` (ai-platform-kit). Read its `SKILL.md`, then the file for the target cloud.

## Inputs

The layout decision comes first. Ask:

> Does more than one business unit share this Databricks deployment, and must teams from different units be prevented from seeing each other's development data by default?

No to either half: propose A. Yes to both: propose B. Do not pick for the user.

| Input | Source | How to obtain |
|---|---|---|
| Layout | Human | Proposal A (one catalog per environment, no prefix) or B (A plus a business-unit prefix on catalogs, workspaces, groups) |
| Environment list | Human | Usually `dev`, `stg`, `prod`. Plus `sandbox` if they want one. |
| Storage strategy | Human | Self-managed storage per catalog (recommended) or Databricks-managed metastore. The skill asks if unstated. |
| Project name | Human | Drives schema names: `<project>_bronze`, `_silver`, `_gold` |
| Owning group per project | Human | Must be account-level. Confirm against `databricks account groups list`. |
| Metastore ID | You derive | `databricks account metastores list`, filtered to the region |
| Workspace IDs | You derive | `databricks account workspaces list`, needed for production catalog binding |
| Resource prefix | You derive | Storage names are globally unique. `<prefix>-catalog-dev` on AWS and GCP, `st<prefix>catalogdev` on Azure. |

:::danger
Each catalog needs its own bucket, container, or storage account.
The skill refuses a shared one: shared storage across environments means a dev job can reach production bytes.
:::

## Run

### 1. Check the metastore before touching it

```bash
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, owner, default_data_access_config_id}'
```

If more than one comes back, do not attach to whichever appears first. Report the list and let the user choose: adopt the clean one, delete the orphans, or create a distinctly named new one.

### 2. List existing catalogs

```bash
databricks catalogs list --profile <name> -o json \
  | jq -r '.[] | "\(.name)\t\(.owner)\t\(.storage_root // "managed")"'
```

Reuse rather than duplicate.

### 3. Invoke the skill

Pass the layout decision, the environment list, the project name, and the owning groups.
It writes the Terraform for storage plus credential plus external location plus catalog plus schemas plus grants, then runs `init` and `plan`.

For production, the skill sets `isolation_mode = "ISOLATED"` on the catalog and binds it to the production workspace. Dev and staging stay `OPEN`.

### 4. Plan review

Mandatory. Get explicit approval before `apply`.

## Verify

```bash
# Every catalog exists, group-owned, with its own storage root
databricks catalogs list --profile <name> -o json \
  | jq -r '.[] | select(.name | startswith("<prefix>") or test("^(dev|stg|prod|sandbox)")) | "\(.name)\t\(.owner)\t\(.storage_root)"'

# Storage roots are distinct: this must print nothing
databricks catalogs list --profile <name> -o json \
  | jq -r '[.[] | select(.storage_root != null) | .storage_root] | group_by(.) | map(select(length > 1)) | .[][]'

# Medallion schemas present
databricks schemas list --catalog <catalog> --profile <name> -o json | jq -r '.[] | .name'

# Grants landed on groups, not users
databricks grants get SCHEMA <catalog>.<project>_gold --profile <name> -o json \
  | jq -r '.privilege_assignments[]? | "\(.principal)\t\(.privileges | join(","))"'

# Production is bound to the production workspace only
databricks catalogs get <prod-catalog> --profile <name> -o json | jq '{name, isolation_mode}'
```

Expected: a group in every `owner` field, the duplicate-storage check silent, `<project>_bronze` / `_silver` / `_gold` listed, group names (never email addresses) in the grant output, and `ISOLATED` on the production catalog.

Then confirm data actually moves through the catalog:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "CREATE TABLE <catalog>.<project>_bronze._verify (id INT); INSERT INTO <catalog>.<project>_bronze._verify VALUES (1); SELECT count(*) FROM <catalog>.<project>_bronze._verify; DROP TABLE <catalog>.<project>_bronze._verify",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

Expected text:

```text
SUCCEEDED
```

A failure here with the metadata all correct usually means the storage credential cannot reach the bucket.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `PERMISSION_DENIED: User is not an owner of Metastore` | Caller cannot create catalogs | Add them to the metastore admin group |
| Catalog created, admins cannot see it | A service principal created and therefore owns it | Grant the human admin group `ALL_PRIVILEGES` and `MANAGE` on the location and credential, or transfer ownership |
| Classic compute cannot read the catalog | Databricks-managed metastore storage, which is serverless-only | Deploy a self-managed metastore with the customer's own bucket |
| `Storage root already in use` | Two catalogs pointed at one location | One dedicated bucket or container per catalog |
| Grants applied but the group sees nothing | Group is workspace-local | Recreate at account level |
| Production catalog visible from dev | `isolation_mode` left `OPEN`, or no workspace binding | Set `ISOLATED` and add `databricks_workspace_binding` |

## Next

- **Do next:** [Cloud Object Storage access](/docs/01-infra-setup/cloud-object-storage/)
- **Manual fallback:** [Starter Journey: data governance](https://databricks-solutions.github.io/starter-journey/docs/05-data-governance-strategy/)
- **Reference:** [Create catalogs](https://docs.databricks.com/aws/en/catalogs/create-catalog)
