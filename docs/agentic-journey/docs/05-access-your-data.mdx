---
sidebar_position: 0
sidebar_label: 5. Access your data
description: Create storage credentials and external locations over the customer's object storage, and set up managed ingestion where the source is a database or SaaS app.
---

# 5. Access your data

**Goal:** Databricks can read the customer's own data paths through Unity Catalog, with a storage credential and an external location per path.

**Skill:** `databricks-unity-catalog-setup` (ai-platform-kit) for object storage. `databricks-lakeflow-connect` (databricks-agent-skills) for SaaS and database sources.

**Prerequisites:** [4. Create catalogs](/docs/04-data-governance-strategy/create-catalogs) complete.

Two ways in, and which one applies depends only on where the data already sits.

| Source | Path | Skill |
|---|---|---|
| S3, ADLS, or GCS | Storage credential plus external location | `databricks-unity-catalog-setup` |
| Salesforce, Workday, ServiceNow, Google Analytics 4, HubSpot, Confluence | Managed ingestion pipeline | `databricks-lakeflow-connect` |
| SQL Server, or PostgreSQL and MySQL CDC | Managed ingestion pipeline | `databricks-lakeflow-connect` |
| Anything else | Read it in the pipeline itself | [6. Build the first pipeline](/docs/06-build-first-pipeline/) |

Both paths land in Unity Catalog, so access is governed and audited in one place either way.

## Object storage

### Inputs

| Input | Source | How to obtain |
|---|---|---|
| Storage path | Human | The exact URI: `s3://bucket/prefix/`, `abfss://container@account.dfs.core.windows.net/prefix/`, or `gs://bucket/prefix/`. Ask for the full path, not just the bucket. |
| Read or read-write | Human | Whether Databricks writes back to this path. Landing zones are usually read-only. |
| Which groups need access | Human | Account-level groups. `READ FILES` for consumers, `WRITE FILES` for writers. |
| Cloud IAM identity | Human on AWS and GCP | AWS: the IAM role ARN Databricks assumes, plus permission to create it. GCP: the service account. Azure: the Access Connector, which the skill creates. |
| Credential and location names | You derive | `<prefix>-cred-<purpose>`, `<prefix>-loc-<purpose>` |

The credential is the cloud identity; the external location is the path plus that credential.
One credential can back several external locations.

:::warning
An external location must not overlap another one, and must not sit inside a catalog's managed storage root.
Overlapping paths make grants ambiguous, and Unity Catalog rejects the create.
Check the existing locations before proposing a path.
:::

### Run

```bash
# 1. What already exists. Check for overlap before creating anything.
databricks external-locations list --profile <name> -o json \
  | jq -r '.[] | "\(.name)\t\(.url)\t\(.credential_name)"'

databricks storage-credentials list --profile <name> -o json \
  | jq -r '.[] | "\(.name)\t\(.owner)"'
```

Then invoke `databricks-unity-catalog-setup` with the path and access mode.
It writes the cloud IAM side and the Unity Catalog side in one Terraform apply, then stops for the plan review.

### Verify

```bash
# The credential can actually reach the path. This is the check that matters.
databricks external-locations validate --profile <name> --json '{
  "external_location_name": "<location-name>"
}' | jq '{isDir, results: [.results[] | {operation, result, message}]}'

# Grants are on groups
databricks grants get EXTERNAL_LOCATION <location-name> --profile <name> -o json \
  | jq -r '.privilege_assignments[]? | "\(.principal)\t\(.privileges | join(","))"'
```

Expect every `result` to be `PASS` for the operations the access mode allows.
A `READ` pass with a `WRITE` fail on a read-only location is correct, not a problem.

Then read a real file:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT count(*) AS files FROM list_files(\"<storage-path>\")",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0][0]'
```

Expect a file count.
`0` means the path is real but empty, which is a different answer from a permission error.

### Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `validate` returns `FAIL` on every operation | IAM role trust policy or Access Connector role assignment not propagated | Wait a minute and re-validate. Cloud IAM is eventually consistent. |
| `Overlapping external location` | Path is inside an existing location or a catalog's managed root | Pick a non-overlapping prefix, or reuse the existing location |
| `PERMISSION_DENIED` creating the credential | Caller lacks `CREATE STORAGE CREDENTIAL` on the metastore | Metastore admin grants it, or runs this step |
| Location works for the creator only | Service principal owns it, no grants issued | Grant `READ FILES` to the consuming groups and `MANAGE` to the admin group |
| Azure: `AuthorizationFailed` on validate | Access Connector missing `Storage Blob Data Contributor` on the account | Add the role assignment, then re-validate |

## Managed ingestion

For a SaaS app or an operational database, `databricks-lakeflow-connect` builds a managed serverless pipeline that lands the source into Unity Catalog Delta tables.

### Inputs

| Input | Source | How to obtain |
|---|---|---|
| Source system | Human | Which connector. The skill covers Salesforce, Workday Reports, ServiceNow, Google Analytics 4, HubSpot, Confluence, SQL Server, and PostgreSQL/MySQL CDC. |
| Source credentials | Human | Per connector. Put them in a secret scope, never in bundle YAML. |
| Objects to ingest | Human | Which tables, objects, or reports |
| Target catalog and schema | You derive | The bronze schema from [Create catalogs](/docs/04-data-governance-strategy/create-catalogs) |
| Network reachability | Human | For on-prem SQL Server, whether the source is reachable from serverless. If not, this needs `databricks-private-networking` and an NCC. |

If the user's source is not in that connector list, do not force it.
Read it in the pipeline instead, in [6. Build the first pipeline](/docs/06-build-first-pipeline/).

### Verify

```bash
databricks pipelines list-pipelines --profile <name> -o json \
  | jq -r '.[] | select(.name | test("<pipeline-name>")) | "\(.name)\t\(.state)"'

databricks tables list --catalog <catalog> --schema <project>_bronze --profile <name> -o json \
  | jq -r '.[] | .name'
```

Expect the pipeline in a healthy state and the ingested tables listed.

## Next

- **Do next:** [6. Build the first pipeline](/docs/06-build-first-pipeline/)
- **Manual fallback:** [Starter Journey: Cloud object storage](https://databricks-solutions.github.io/starter-journey/docs/06-access-your-data/cloud-object-storage/)
- **Reference:** [External locations](https://docs.databricks.com/aws/en/connect/unity-catalog/external-locations)
