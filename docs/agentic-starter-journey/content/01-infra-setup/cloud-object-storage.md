---
description: Create a cloud IAM identity, then a Unity Catalog storage credential and a read-only external location so Databricks can read the customer's object storage.
---

# Cloud Object Storage access

## Mental Model

Databricks does not hold long-lived cloud keys in notebooks.
It assumes a cloud identity you create (IAM role, Access Connector, or service account), then binds that identity to a Unity Catalog storage credential and an external location over the customer's path.
One credential can back several locations.
This page connects **existing** customer landing / lake paths.
Catalog managed storage was created on [Catalogs](/docs/01-infra-setup/catalogs/).
Do not overlap those roots.

## Goal

A storage credential plus a **read-only** external location so Databricks can list and read the customer's object storage path through Unity Catalog.

## Prerequisites

- [Catalogs](/docs/01-infra-setup/catalogs/) complete, so a metastore is assigned and there is somewhere to grant access.
- Auth surface: both (account profile, workspace profile, and cloud CLI for the target cloud).
- `databricks metastores current` succeeds on the workspace profile.
- Permission for the skill to create the cloud identity (IAM role / Access Connector / service account) in the customer's cloud account.
- Caller has `CREATE STORAGE CREDENTIAL` and `CREATE EXTERNAL LOCATION` on the metastore (metastore admin has both by default).
- Azure: User Access Administrator or Owner on the RG/subscription so Access Connector role assignments succeed. Contributor alone fails with `AuthorizationFailed` on `roleAssignments/write`.

## Skill

`databricks-unity-catalog-setup` (ai-platform-kit).
Read its `SKILL.md`, then the cloud file (`AWS.md` / `AZURE.md` / `GCP.md`).
It writes the cloud IAM side and the Unity Catalog side together, then stops for plan review unless the brief already approved apply.

## Hard rule: read-only

This page always creates a **read-only** external location (`read_only = true`).
Grant consumers `READ FILES` only.
Do not grant `WRITE FILES`.
If the human needs Databricks to write into this path, stop and say this page is the wrong path.
Do not flip the location to read-write here.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Storage path | Human | Exact URI: `s3://bucket/prefix/`, `abfss://container@account.dfs.core.windows.net/prefix/`, or `gs://bucket/prefix/`. Ask for the full path, not just the bucket name. |
| Which groups need read access | Human | Account-level groups. Grant `READ FILES` only. |
| Cloud IAM identity | Skill-derived unless reusing | Default: skill creates the IAM role (AWS), Access Connector (Azure), or service account (GCP) with **read** permissions on the path. Only ask for an existing ARN/identity when reusing. |
| Credential and location names | You derive | From a ≤3-option naming pick, or from the human's existing names. Patterns like `<prefix>_cred_<purpose>` / `<prefix>_ext_<purpose>` (underscores). |

:::warning
An external location must not overlap another one, and must not sit inside a catalog's managed storage root.
Overlapping paths make grants ambiguous, and Unity Catalog rejects the create.
List existing locations before proposing a path.
:::

## Run

### 0. Auth precheck

Refuse if the human did not name all of these: Databricks account id, Databricks account CLI profile, workspace host, workspace id, workspace CLI profile, target cloud (`aws`, `azure`, or `gcp`), cloud account id, cloud CLI profile.
Do not invoke the skill until every named target is present.

Run live checks:

```bash
databricks auth profiles
databricks account workspaces list --profile <account-profile> -o json | jq 'length'
databricks metastores current --profile <workspace-profile> -o json | jq '{workspace_id, metastore_id, name}'
databricks current-user me --profile <workspace-profile> -o json | jq '{userName, workspace_id}'
aws sts get-caller-identity --profile <aws-profile>     # AWS: Account must equal named cloud account id
az account show --profile <azure-profile>                  # Azure: tenant + subscription must match named ids
gcloud auth list                                           # GCP: active account must match named project
```

Confirm the workspace profile reaches the named host and that `workspace_id` matches the human-named workspace id.
Compare live cloud identity and Databricks account id to the human-named values when obtainable.

On any failure, print **blocked: auth preflight failed**, name the failing check, give the human these remediations, and **stop**.
Do not invoke the skill.
Do not run Terraform.

| Check failed | Human must run |
|---|---|
| Account profile missing or `Valid=NO` | `databricks auth login --host <account-host> --profile <account-profile>` or fix M2M SP secret and Account admin role |
| `account workspaces list` fails | Confirm Account admin on the SP; regenerate OAuth secret (AWS) |
| `metastores current` or `current-user me` fails | `databricks auth login --host <workspace-host> --profile <workspace-profile>` |
| Workspace id mismatch | Fix workspace profile or human-named workspace id |
| Cloud CLI not authenticated | `aws sso login --profile <aws-profile>` / `az login --tenant <tenant>` / `gcloud auth login` |
| Cloud account id mismatch | Pick the profile whose account id matches the human-named cloud account id |

### 1. Check what already exists

```bash
databricks external-locations list --profile <workspace-profile> -o json \
  | jq -r '.[] | "\(.name)\t\(.url)\t\(.credential_name)\t\(.read_only)"'

databricks storage-credentials list --profile <workspace-profile> -o json \
  | jq -r '.[] | "\(.name)\t\(.owner)\t\(.read_only)"'
```

If a location already covers the path, reuse it.
Do not create a second overlapping location.

### 2. Naming (new credential + location)

Present ≤3 naming options for the credential and the external location.
Wait for a pick before writing HCL.
Do not invent a new bucket unless the human asked for one.
This page's default is connect-to-existing path.

### 3. Invoke the skill

Pass:

1. The storage path.
2. That the external location must be **read-only**.
3. That the cloud IAM policy is read-scoped (AWS: `s3:GetObject`, `s3:ListBucket`, `s3:GetBucketLocation` on the bucket/prefix; no `PutObject` / `DeleteObject` for this path).
4. The consuming groups for `READ FILES`.

On AWS the skill creates (or reuses) an IAM role whose trust policy allows the Unity Catalog master role (with the Databricks account id as `ExternalId`) and self-assume, plus an inline policy that includes `sts:AssumeRole` on the role's own ARN.
Without self-assume in **both** trust and inline policy, credential validation fails with `non self-assuming role`.
Then it creates the storage credential (role ARN) and the external location (`read_only = true`) in the workspace.

### 4. Plan review

Mandatory unless the brief already approved apply.
Get explicit approval before `apply`, or record that the brief approved it.

## Verify

```bash
# Location exists, points at the path, and is read-only
databricks external-locations get <location-name> --profile <workspace-profile> -o json \
  | jq '{name, url, credential_name, read_only}'
```

Expected: `url` matches the intended URI and `read_only` is `true`.

```bash
# Grants are READ FILES on groups only
databricks grants get EXTERNAL_LOCATION <location-name> --profile <workspace-profile> -o json \
  | jq -r '.privilege_assignments[]? | "\(.principal)\t\(.privileges | join(","))"'
```

Expected: consuming groups show `READ_FILES` (or `READ FILES`).
No `WRITE_FILES` / `WRITE FILES`.

Then prove a read works.
Prefer a warehouse SQL check that works on serverless:

```bash
databricks api post /api/2.0/sql/statements --profile <workspace-profile> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "LIST '\''<storage-path>'\''",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

AWS alternative: `SELECT * FROM read_files("<storage-path>") LIMIT 1` when objects exist under the path.
Do not use `databricks external-locations validate` (missing on CLI 1.1.0) or `list_files(...)` (unsupported FILE type on serverless SQL).

Expected: `SUCCEEDED`.
Empty listing with `SUCCEEDED` is different from a permission error.
A write attempt (for example `COPY INTO` or `CREATE TABLE ... LOCATION`) must fail while `read_only` is true.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| **blocked: auth preflight failed** before Run | Missing named account id, profiles, workspace host/id, or cloud account id | Ask the human for every required target; rerun ### 0 |
| Cloud STS fails or account id mismatch | Expired or wrong cloud profile | `aws sso login --profile <aws-profile>` / `az login --tenant <tenant>` / `gcloud auth login` |
| Workspace profile fails `metastores current` | Expired workspace login or wrong host | `databricks auth login --host <workspace-host> --profile <workspace-profile>` |
| Skill invoked despite red precheck | Agent skipped ### 0 | Always run ### 0 first; stop on any failure |
| SQL read fails on every operation | IAM role trust / Access Connector role assignment not propagated | Wait a minute and retry. Cloud IAM is eventually consistent. |
| `non self-assuming role` | AWS role missing `sts:AssumeRole` on its own ARN in the **inline** policy | Add the self-assume statement to the role policy, then re-validate |
| `Overlapping external location` | Path is inside an existing location or a catalog's managed root | Pick a non-overlapping prefix, or reuse the existing location |
| `PERMISSION_DENIED` creating the credential | Caller lacks `CREATE STORAGE CREDENTIAL` on the metastore | Metastore admin grants it, or runs this step |
| Location works for the creator only | Service principal owns it, no grants issued | Grant `READ FILES` to the consuming groups and `MANAGE` to the admin group |
| Write succeeds against a "read" path | External location created without `read_only = true` | Recreate or update the location with `read_only = true`; do not grant `WRITE FILES` |
| Azure: `AuthorizationFailed` on role assignment | Access Connector missing RBAC write rights | Grant User Access Administrator or Owner, assign `Storage Blob Data Reader` for read-only, then retry |

## Next

- **Do next:** [Databricks Projects](/docs/02-databricks-projects/)
- **Manual fallback:** [Starter Journey: cloud object storage](https://databricks-solutions.github.io/starter-journey/docs/06-access-your-data/cloud-object-storage/)
- **Reference:** [External locations](https://docs.databricks.com/aws/en/connect/unity-catalog/external-locations)
