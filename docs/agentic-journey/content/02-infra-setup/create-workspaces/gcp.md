---
sidebar_label: GCP
description: Provision a Databricks workspace on GCP with databricks-platform-provisioning. Service account impersonation, inputs, and verification.
---

# Create workspaces: GCP

**Goal:** a Databricks workspace on GCP with a customer-managed VPC, plus a Unity Catalog metastore in the region.

**Skill:** `databricks-platform-provisioning` (ai-platform-kit). Read its `SKILL.md`, then `GCP.md`, then `gcp-1-auth.md` and `gcp-2-deploy.md`. Do not read the AWS or Azure files.

## Prerequisites

- [1. Prerequisites](/docs/01-prerequisites/) passing, including `terraform version` at 1.9.0 or later.
- `gcloud auth login` plus Application Default Credentials.
- A Google service account that Terraform impersonates to create the workspace.
- The required APIs enabled on the workspace project.

:::warning
GCP auth is not like AWS or Azure. Databricks on GCP needs Google service account impersonation with `auth_type = "google-id"` on every provider block. OAuth M2M client credentials and cached U2M tokens both fail at the `databricks_mws_workspaces` call with a misleading `400 BAD_REQUEST: Failed to get oauth access token`. Without the explicit `auth_type`, the provider drops `google_service_account` and falls through to a credential the accounts API rejects.
:::

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| GCP project ID | Human | `gcloud config get-value project`. Confirm it is the intended project. |
| GCP region | Human | For example `us-central1` |
| Databricks account ID | Human | [accounts.gcp.databricks.com](https://accounts.gcp.databricks.com), top-right user menu |
| Workspace-creator service account | Human | The SA to impersonate, `databricks-workspace-creator@<project>.iam.gserviceaccount.com`. Create it if absent. The caller needs `roles/iam.serviceAccountTokenCreator` on it. |
| Environment strategy | Human | One workspace, or dev / staging / prod |
| Purpose | Human | POC or production |
| Existing VPC? | Human | New VPC, or existing. For existing: network name plus the subnet and its two secondary IP ranges (pods and services). |
| Resource prefix | You derive | GCS bucket names are globally unique, `gs://<prefix>-catalog-dev`. Never reuse a prefix. |

## Run

### 1. Pre-flight

```bash
gcloud auth list
gcloud auth application-default print-access-token >/dev/null \
  && echo "ADC: ok" || echo "ADC: missing"
gcloud config get-value project
env | grep -i DATABRICKS
terraform version
```

If the ADC quota project does not match the active project:

```bash
gcloud auth application-default set-quota-project <project-id>
```

### 2. Enable the required APIs

```bash
for api in compute.googleapis.com container.googleapis.com iam.googleapis.com \
           iamcredentials.googleapis.com cloudresourcemanager.googleapis.com \
           servicenetworking.googleapis.com storage.googleapis.com cloudkms.googleapis.com; do
  gcloud services enable "$api" --project=<project-id>
done
```

`iamcredentials.googleapis.com` is the one people miss. Impersonation fails without it.

### 3. Permission sweep

```bash
bash precheck-gcp.sh
```

### 4. Invoke the skill

Pass the collected inputs. The skill writes the HCL with `google_service_account` and `auth_type = "google-id"` on both the accounts and workspace provider blocks, then runs `terraform init` and `terraform plan`.

### 5. Plan review

The skill stops for a mandatory plan review. Get explicit approval before `terraform apply`.

## Verify

```bash
# Impersonation works before you rely on it
gcloud auth print-identity-token \
  --impersonate-service-account=<sa-email> >/dev/null && echo "impersonation: ok"

# Workspace reached RUNNING
databricks account workspaces list --profile <name>-account -o json \
  | jq -r '.[] | select(.workspace_name | startswith("<prefix>")) | "\(.workspace_name)\t\(.workspace_status)"'

# Metastore in the region
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, default_data_access_config_id}'
```

Expect `impersonation: ok`, `RUNNING`, and a metastore with a non-null `default_data_access_config_id`.

Then run all three paths from `databricks-deployment-verification`. Start the classic cluster early.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `400 BAD_REQUEST: Failed to get oauth access token` | `auth_type = "google-id"` missing, or M2M credentials used instead of impersonation | Set `auth_type` explicitly on every provider block and pass `google_service_account` |
| Impersonation denied | Caller lacks `roles/iam.serviceAccountTokenCreator` on the SA, or `iamcredentials` API is off | Grant the role, enable the API |
| Quota project mismatch warnings | ADC quota project differs from the active project | `gcloud auth application-default set-quota-project <project-id>` |
| Secondary IP range errors on an existing VPC | Subnet missing the pods and services secondary ranges, or they are too small | Add both ranges, sized for peak node count |
| Unity Catalog API unreachable with PSC backend-only | Known limitation on GCP | See the PSC section of `gcp-3-gotchas.md` before promising the topology |

## Next

- **Do next:** [Create groups](/docs/02-infra-setup/create-groups)
- **Manual fallback:** [Starter Journey: GCP console wizard](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/gcp/manual)
- **Reference:** [Databricks on GCP administration](https://docs.databricks.com/gcp/en/admin/)
