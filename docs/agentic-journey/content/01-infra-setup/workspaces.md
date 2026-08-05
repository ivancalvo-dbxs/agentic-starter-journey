---
description: Provision Databricks workspaces with databricks-platform-provisioning. Per-cloud auth inputs, run sequence, and verification.
---

# Workspaces

## Mental Model

A workspace is the compute entry point. It cannot change region or merge with another after creation, so the layout is a one-way decision.
Databricks manages workspaces through Terraform, not the console wizard.
`databricks-platform-provisioning` writes that Terraform from the requirements and runs `plan`, then stops for a human approval before `apply`.
Default to three workspaces (dev, staging, prod), each in its own VPC or VNet. One workspace is fine for a POC.

## Goal

One workspace per environment, each with its own network and Secure Cluster Connectivity, plus a Unity Catalog metastore in the region.

## Prerequisites

- [Pre-requisites](/docs/01-infra-setup/prerequisites/) passing, including `terraform version` at 1.9.0 or later.
- An authenticated cloud CLI session with permission to create IAM roles, object storage, and VPC or VNet resources.
- A Databricks account-admin service principal with an OAuth secret (AWS), or `azure-cli` auth (Azure), or service account impersonation (GCP). See the per-cloud row below.

## Skill

`databricks-platform-provisioning` (ai-platform-kit). Read its `SKILL.md`, then the file for the target cloud only. Reading the other clouds' files adds noise.

## Inputs

Ask for every human-sourced value in one message.

| Input | Source | How to obtain |
|---|---|---|
| Cloud | Human | `aws`, `azure`, or `gcp` |
| Cloud region | Human | `us-east-1` / `eastus` / `us-central1` |
| Databricks account ID | Human | [accounts.cloud.databricks.com](https://accounts.cloud.databricks.com), top-right user menu |
| Environment strategy | Human | One workspace, or dev / staging / prod |
| Purpose | Human | POC or production. Production gets VPC/VNet injection plus Secure Cluster Connectivity. |
| Existing network? | Human | New network, or an existing one. For existing, also need VPC/VNet ID, subnet IDs (two private subnets in different AZs), and security group IDs. |
| Resource prefix | You derive | From the customer or project name. Object storage names are globally unique, so never reuse a prefix. |
| Workspace names | You derive | `<prefix>-dev`, `<prefix>-staging`, `<prefix>-prod` |

Per-cloud provider auth:

| Cloud | Databricks provider auth | What you need |
|---|---|---|
| AWS | OAuth M2M with an account-admin service principal | SP client ID and OAuth secret. The secret is shown once at generation. |
| Azure | `auth_type = "azure-cli"` on every provider block | `az login`, plus `azure_tenant_id` on every provider block. |
| GCP | `auth_type = "google-id"` with service account impersonation | The service account, with impersonation rights. |

:::danger
The OAuth secret (AWS) is displayed once. Do not write it to a file in the repo, and do not echo it back. Pass it through environment variables only.
:::

## Run

### 1. Pre-flight

```bash
aws sts get-caller-identity --profile <aws-profile>     # AWS
az account show                                          # Azure
gcloud auth list                                         # GCP
env | grep -i DATABRICKS          # stale DATABRICKS_HOST or DATABRICKS_TOKEN breaks provider auth
databricks auth profiles          # never echoes secrets
terraform version                 # >= 1.9.0
```

A stale `DATABRICKS_HOST` or `DATABRICKS_TOKEN` in the shell is the most common cause of a confusing provider auth failure. Unset them.

### 2. Permission sweep

Read-only. Returns which deployment topologies the caller's cloud permissions support, before any HCL exists.

```bash
bash precheck-aws.sh      # or precheck-azure.sh / precheck-gcp.sh, from the skill's scripts/
```

### 3. Invoke the skill

Hand the skill the collected inputs and let it run its own intake for anything missing. It writes the HCL, then runs `terraform init` and `terraform plan`.

### 4. Plan review

The skill stops here. Show the plan to the user and get an explicit approval before `terraform apply`. Resources created here cost money and are slow to unwind.

## Verify

```bash
# Every workspace reached RUNNING
databricks account workspaces list --profile <name>-account -o json \
  | jq -r '.[] | select(.workspace_name | startswith("<prefix>")) | "\(.workspace_name)\t\(.workspace_status)"'

# Metastore exists in the region and is not an orphan
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, default_data_access_config_id}'

# Workspace-level auth reaches the new workspace
databricks current-user me --profile <name> -o json | jq -r '.userName'
```

Expected text:

```text
<prefix>-dev        RUNNING
<prefix>-staging    RUNNING
<prefix>-prod       RUNNING
{"name":"<prefix>","metastore_id":"...","default_data_access_config_id":"..."}
<your-email>
```

Then run all three paths from `databricks-deployment-verification`: classic cluster, serverless SQL warehouse, serverless notebook job, each doing CREATE, INSERT, SELECT, DROP on a Unity Catalog table. Start the classic cluster early; cold start is 10 to 15 minutes.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `400 BAD_REQUEST: Failed to get oauth access token` (AWS) | SP is not an account admin, or the secret is wrong | Confirm the Account admin role on the Roles tab, regenerate the secret |
| Provider hits the wrong host | `DATABRICKS_HOST` or `DATABRICKS_TOKEN` set in the shell | `unset` both, re-run |
| `PERMISSION_DENIED: User is not an owner of Metastore` | The SP cannot create catalogs | Add the SP to the metastore admin group |
| Apply fails on IAM or VPC | Cloud principal lacks create rights | Run the precheck script and report the gaps rather than retrying |
| Multiple metastores returned for the region | Orphan metastores from earlier deploys | Do not silently reuse one. Report the list and let the user choose. |
| Azure `azure-cli` auth fails | Not signed in, or `azure_tenant_id` missing | `az login`, add `azure_tenant_id` on every provider block |

## Next

- **Manual fallback:** [Starter Journey: create workspaces](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/)
- **Reference:** [Databricks Terraform provider](https://registry.terraform.io/providers/databricks/databricks/latest/docs)
