---
description: Create storage credentials and external locations over the customer's object storage with databricks-unity-catalog-setup, so Databricks reads the data through Unity Catalog.
---

# Cloud Object Storage access

## Mental Model

Databricks reads the customer's data through Unity Catalog, not by holding cloud credentials in code.
A storage credential is the cloud identity (IAM role, Access Connector, service account). An external location is a storage path plus that credential.
One credential can back several external locations. The credential and the location come up together in one Terraform apply.
This page is for customer data-lake paths that are separate from a catalog's managed storage root. Catalog managed storage was created on [Catalogs](/docs/01-infra-setup/catalogs/).

## Goal

Databricks can read the customer's object storage paths through Unity Catalog, with a storage credential and an external location per path.

## Prerequisites

- [Catalogs](/docs/01-infra-setup/catalogs/) complete, so there is a metastore and a place to grant access.
- `databricks metastores current` succeeds on the workspace profile.
- Permission for the skill to create the cloud identity (IAM role / Access Connector / service account).
- Azure: User Access Administrator or Owner on the RG/subscription so Access Connector role assignments succeed. Contributor alone fails with `AuthorizationFailed` on `roleAssignments/write`.

## Skill

`databricks-unity-catalog-setup` (ai-platform-kit). It writes the cloud IAM side and the Unity Catalog side in one Terraform apply, then stops for the plan review.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Storage path | Human | The exact URI: `s3://bucket/prefix/`, `abfss://container@account.dfs.core.windows.net/prefix/`, or `gs://bucket/prefix/`. Ask for the full path, not just the bucket. |
| Read or read-write | Human | Whether Databricks writes back to this path. Landing zones are usually read-only. |
| Which groups need access | Human | Account-level groups. `READ FILES` for consumers, `WRITE FILES` for writers. |
| Cloud IAM identity | Skill-derived unless reusing | Default: the skill creates the IAM role (AWS), Access Connector (Azure), or service account (GCP). Only ask the human for an existing ARN/identity when reusing. |
| Credential and location names | You derive | From a ≤3-option naming pick when creating new storage, or from the human's existing URI. Patterns like `<prefix>-cred-<purpose>` / `databricks-<prefix>-cred-<purpose>`. |

:::warning
An external location must not overlap another one, and must not sit inside a catalog's managed storage root.
Overlapping paths make grants ambiguous, and Unity Catalog rejects the create.
Check the existing locations before proposing a path.
:::

## Run

### 1. Check what already exists

```bash
databricks external-locations list --profile <workspace-profile> -o json \
  | jq -r '.[] | "\(.name)\t\(.url)\t\(.credential_name)"'

databricks storage-credentials list --profile <workspace-profile> -o json \
  | jq -r '.[] | "\(.name)\t\(.owner)"'
```

### 2. Naming (when creating new lake storage)

If the human gives an existing URI, skip this step and use that path.
If you must create a new data-lake bucket/container, present ≤3 naming options (plain prefix vs org cloud prefix such as `databricks-…`), wait for a pick, then map to Terraform inputs. Do not fill HCL before the pick.

### 3. Invoke the skill

Pass the path and the access mode. It writes the cloud IAM side and the Unity Catalog side in one apply, then stops for the plan review.

### 4. Plan review

Mandatory. Get explicit approval before `apply`.
If the human already approved apply in the task brief, apply and record that approval.

## Verify

```bash
# Location exists and points at the intended URI
databricks external-locations get <location-name> --profile <workspace-profile> -o json \
  | jq '{name, url, credential_name}'

# Grants are on groups
databricks grants get EXTERNAL_LOCATION <location-name> --profile <workspace-profile> -o json \
  | jq -r '.privilege_assignments[]? | "\(.principal)\t\(.privileges | join(","))"'
```

Then prove the credential can read (and write, if requested). Prefer a warehouse SQL check that works on serverless:

```bash
# After placing a small probe object at the URI (cloud CLI or WRITE FILES)
databricks api post /api/2.0/sql/statements --profile <workspace-profile> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT * FROM read_files(\"<storage-path>probe/\") LIMIT 1",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

AWS alternative that also works: `LIST 's3://bucket/prefix/'` via the same SQL statements API.
Do not use `databricks external-locations validate` (missing on CLI 1.1.0) or `list_files(...)` (unsupported FILE type on serverless SQL).

Expected: `SUCCEEDED` and at least one row when a probe object exists. Empty path with `SUCCEEDED` is different from a permission error.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| SQL read fails on every operation | IAM role trust policy or Access Connector role assignment not propagated | Wait a minute and retry. Cloud IAM is eventually consistent. |
| `Overlapping external location` | Path is inside an existing location or a catalog's managed root | Pick a non-overlapping prefix, or reuse the existing location |
| `PERMISSION_DENIED` creating the credential | Caller lacks `CREATE STORAGE CREDENTIAL` on the metastore | Metastore admin grants it, or runs this step |
| Location works for the creator only | Service principal owns it, no grants issued | Grant `READ FILES` to the consuming groups and `MANAGE` to the admin group |
| Azure: `AuthorizationFailed` on role assignment | Access Connector missing RBAC write rights | Grant User Access Administrator or Owner, assign `Storage Blob Data Contributor`, then retry |

## Next

- **Do next:** [Databricks Projects](/docs/02-databricks-projects/)
- **Manual fallback:** [Starter Journey: cloud object storage](https://databricks-solutions.github.io/starter-journey/docs/06-access-your-data/cloud-object-storage/)
- **Reference:** [External locations](https://docs.databricks.com/aws/en/connect/unity-catalog/external-locations)
