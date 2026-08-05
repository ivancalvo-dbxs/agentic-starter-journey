---
sidebar_label: Create catalogs
description: Create catalogs with their own object storage, medallion schemas, and group grants using databricks-unity-catalog-setup.
---

# Create catalogs

**Goal:** one catalog per environment, each backed by its own object storage, with medallion schemas and schema-level group grants.

**Skill:** `databricks-unity-catalog-setup` (ai-platform-kit). Read its `SKILL.md`, then the file for the target cloud (`AWS.md`, `AZURE.md`, or `GCP.md`).

**Prerequisites:** a decision from [4. Data governance strategy](/docs/04-data-governance-strategy/), and [Metastore owner](/docs/02-infra-setup/metastore-owner) complete.

The catalog and its storage come up together.
This is not two steps: the skill creates the bucket or container, the storage credential, the external location, and the catalog with a `MANAGED LOCATION` pointing at it, in one Terraform apply.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Layout | Human | Proposal A or B from the previous page, plus the business-unit list if B |
| Environment list | Human | Usually `dev`, `stg`, `prod`. Plus `sandbox` if they said yes. |
| Storage strategy | Human | Self-managed storage per catalog (recommended) or the Databricks-managed metastore. The skill asks if unstated. |
| Project name | Human | Drives schema names, `<project>_bronze` and so on |
| Owning group per project | Human | Must be an account-level group. Confirm against `databricks account groups list`. |
| Metastore ID | You derive | `databricks account metastores list`, filtered to the region |
| Workspace IDs | You derive | `databricks account workspaces list`, needed for production catalog binding |
| Resource prefix | You derive | Storage names are globally unique. `<prefix>-catalog-dev` on AWS and GCP, `st<prefix>catalogdev` on Azure (alphanumeric only). |

:::danger
Each catalog needs its own bucket, container, or storage account.
The skill refuses a shared one, and it is right to: shared storage across environments means a dev job can reach production bytes.
:::

## Run

### 1. Check the metastore before touching it

```bash
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, owner, default_data_access_config_id}'
```

Sandbox and shared-tenant accounts often carry orphan metastores from earlier deploys, with stale credentials or unreachable storage roots.
If more than one comes back, do not attach to whichever appears first.
Report the list and let the user choose: adopt the clean one, delete the orphans, or create a distinctly named new one.

### 2. List existing catalogs

```bash
databricks catalogs list --profile <name> -o json \
  | jq -r '.[] | "\(.name)\t\(.owner)\t\(.storage_root // "managed")"'
```

Reuse rather than duplicate.

### 3. Invoke the skill

Pass the layout decision, the environment list, the project name, and the owning groups.
It writes the Terraform for storage plus credential plus external location plus catalog plus schemas plus grants, then runs `init` and `plan`.

For production, the skill sets `isolation_mode = "ISOLATED"` on the catalog and binds it to the production workspace with `databricks_workspace_binding`.
Dev and staging stay `OPEN`.

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

Expect: a group in every `owner` field, the duplicate-storage check silent, `<project>_bronze` / `_silver` / `_gold` listed, group names (never email addresses) in the grant output, and `ISOLATED` on the production catalog.

Then confirm data actually moves through the catalog rather than trusting the metadata:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "CREATE TABLE <catalog>.<project>_bronze._verify (id INT); INSERT INTO <catalog>.<project>_bronze._verify VALUES (1); SELECT count(*) FROM <catalog>.<project>_bronze._verify; DROP TABLE <catalog>.<project>_bronze._verify",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

Expect `SUCCEEDED`.
A failure here with the metadata all correct usually means the storage credential cannot reach the bucket.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `PERMISSION_DENIED: User is not an owner of Metastore` | Caller cannot create catalogs | Add them to the metastore admin group, or ``GRANT CREATE CATALOG ON METASTORE TO `<principal>` `` |
| Catalog created, admins cannot see it | A service principal created and therefore owns it | Grant the human admin group `ALL_PRIVILEGES` on the catalog and `MANAGE` on the external location and storage credential, or transfer ownership |
| Classic compute cannot read the catalog | Databricks-managed (vending machine) metastore storage, which is serverless-only | Deploy a self-managed metastore with the customer's own bucket |
| `Storage root already in use` | Two catalogs pointed at one location | One dedicated bucket or container per catalog |
| Grants applied but the group sees nothing | Group is workspace-local | Recreate at account level. See [Create groups](/docs/02-infra-setup/create-groups). |
| Production catalog visible from dev | `isolation_mode` left `OPEN`, or no workspace binding | Set `ISOLATED` and add `databricks_workspace_binding` |

## Next

- **Do next:** [5. Access your data](/docs/05-access-your-data)
- **Manual fallback:** [Starter Journey: Small organizations](https://databricks-solutions.github.io/starter-journey/docs/05-data-governance-strategy/small-organizations)
- **Reference:** [Create catalogs](https://docs.databricks.com/aws/en/catalogs/create-catalog)
