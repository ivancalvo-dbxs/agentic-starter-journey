---
description: Create storage credentials and external locations over the customer's object storage with databricks-unity-catalog-setup, so Databricks reads the data through Unity Catalog.
---

# Cloud Object Storage access

## Mental Model

Databricks reads the customer's data through Unity Catalog, not by holding cloud credentials in code.
A storage credential is the cloud identity (IAM role, Access Connector, service account). An external location is a storage path plus that credential.
One credential can back several external locations. The credential and the location come up together in one Terraform apply.

## Goal

Databricks can read the customer's object storage paths through Unity Catalog, with a storage credential and an external location per path.

## Prerequisites

- [Catalogs](/docs/01-infra-setup/catalogs/) complete, so there is a metastore and a place to grant access.
- The cloud IAM identity Databricks will assume, plus permission to create it.

## Skill

`databricks-unity-catalog-setup` (ai-platform-kit). It writes the cloud IAM side and the Unity Catalog side in one Terraform apply, then stops for the plan review.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Storage path | Human | The exact URI: `s3://bucket/prefix/`, `abfss://container@account.dfs.core.windows.net/prefix/`, or `gs://bucket/prefix/`. Ask for the full path, not just the bucket. |
| Read or read-write | Human | Whether Databricks writes back to this path. Landing zones are usually read-only. |
| Which groups need access | Human | Account-level groups. `READ FILES` for consumers, `WRITE FILES` for writers. |
| Cloud IAM identity | Human on AWS and GCP | AWS: the IAM role ARN Databricks assumes, plus permission to create it. GCP: the service account. Azure: the Access Connector, which the skill creates. |
| Credential and location names | You derive | `<prefix>-cred-<purpose>`, `<prefix>-loc-<purpose>` |

:::warning
An external location must not overlap another one, and must not sit inside a catalog's managed storage root.
Overlapping paths make grants ambiguous, and Unity Catalog rejects the create.
Check the existing locations before proposing a path.
:::

## Run

### 1. Check what already exists

```bash
databricks external-locations list --profile <name> -o json \
  | jq -r '.[] | "\(.name)\t\(.url)\t\(.credential_name)"'

databricks storage-credentials list --profile <name> -o json \
  | jq -r '.[] | "\(.name)\t\(.owner)"'
```

### 2. Invoke the skill

Pass the path and the access mode. It writes the cloud IAM side and the Unity Catalog side in one apply, then stops for the plan review.

### 3. Plan review

Mandatory. Get explicit approval before `apply`.

## Verify

```bash
# The credential can actually reach the path. This is the check that matters.
databricks external-locations validate --profile <name> --json '{
  "external_location_name": "<location-name>"
}' | jq '{isDir, results: [.results[] | {operation, result, message}]}'

# Grants are on groups
databricks grants get EXTERNAL_LOCATION <location-name> --profile <name> -o json \
  | jq -r '.privilege_assignments[]? | "\(.principal)\t\(.privileges | join(","))"'
```

Expected: every `result` is `PASS` for the operations the access mode allows. A `READ` pass with a `WRITE` fail on a read-only location is correct.

Then read a real file:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS files FROM list_files(\"<storage-path>\")",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0][0]'
```

Expected: a file count. `0` means the path is real but empty, which is a different answer from a permission error.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `validate` returns `FAIL` on every operation | IAM role trust policy or Access Connector role assignment not propagated | Wait a minute and re-validate. Cloud IAM is eventually consistent. |
| `Overlapping external location` | Path is inside an existing location or a catalog's managed root | Pick a non-overlapping prefix, or reuse the existing location |
| `PERMISSION_DENIED` creating the credential | Caller lacks `CREATE STORAGE CREDENTIAL` on the metastore | Metastore admin grants it, or runs this step |
| Location works for the creator only | Service principal owns it, no grants issued | Grant `READ FILES` to the consuming groups and `MANAGE` to the admin group |
| Azure: `AuthorizationFailed` on validate | Access Connector missing `Storage Blob Data Contributor` on the account | Add the role assignment, then re-validate |

## Next

- **Do next:** [Databricks Projects](/docs/02-databricks-projects/)
- **Manual fallback:** [Starter Journey: cloud object storage](https://databricks-solutions.github.io/starter-journey/docs/06-access-your-data/cloud-object-storage/)
- **Reference:** [External locations](https://docs.databricks.com/aws/en/connect/unity-catalog/external-locations)
