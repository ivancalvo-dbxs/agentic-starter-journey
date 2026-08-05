---
sidebar_label: AWS
description: Provision a Databricks workspace on AWS with databricks-platform-provisioning. Inputs, run sequence, and verification.
---

# Create workspaces: AWS

**Goal:** a Databricks workspace on AWS with a customer-managed VPC and Secure Cluster Connectivity, plus a Unity Catalog metastore in the region.

**Skill:** `databricks-platform-provisioning` (ai-platform-kit). Read its `SKILL.md`, then `AWS.md`, then `aws-1-auth.md` and `aws-2-deploy.md`. Do not read the Azure or GCP files.

## Prerequisites

- [1. Prerequisites](/docs/01-prerequisites/) passing, including `terraform version` at 1.9.0 or later.
- An authenticated AWS CLI session with permission to create IAM roles, S3 buckets, and VPC resources.
- A Databricks account-admin service principal with an OAuth secret. This is the load-bearing credential. If the user does not have one, create it before writing any Terraform (see below).

## Inputs

Ask for every human-sourced value in one message, with the how-to-obtain text.

| Input | Source | How to obtain |
|---|---|---|
| AWS CLI profile | Human | The named profile to deploy with. `aws configure list-profiles` shows the options. Confirm which one, do not guess the default. |
| AWS region | Human | For example `us-east-1`. Must match where they want compute to run. |
| Databricks account ID | Human | [accounts.cloud.databricks.com](https://accounts.cloud.databricks.com), top-right user menu |
| SP client ID | Human | Account console, service principal application ID |
| SP client secret | Human | Shown once at generation. If lost, generate a new secret rather than asking them to hunt for it. |
| Environment strategy | Human | One workspace, or dev / staging / prod |
| Purpose | Human | POC or production. Production gets VPC injection plus SCC. |
| Existing VPC? | Human | New VPC, or an existing one. For existing, you also need VPC ID, subnet IDs (two private subnets in different AZs), and security group IDs. |
| Resource prefix | You derive | From the customer or project name. S3 bucket names are globally unique, so never reuse a prefix. |
| Workspace names | You derive | `<prefix>-dev`, `<prefix>-staging`, `<prefix>-prod` |

## One-time service principal setup

Per Databricks account, not per workspace. Skip if the user already has an account-admin SP with an OAuth secret.

Console path: account console, **User Management** > **Service principals** > add one (for example `terraform-deployer`), grant it the **Account admin** role on the Roles tab, then **Settings** > **Identity and access** > **Service principals** > your SP > **Secrets** > **Generate**. Capture the client ID (application ID) and secret.

:::danger
The OAuth secret is displayed once. Do not write it to a file in the repo, and do not echo it back in your output. Pass it through environment variables only.
:::

## Run

### 1. Pre-flight

```bash
aws sts get-caller-identity --profile <aws-profile>
env | grep -i DATABRICKS          # conflicting env vars break provider auth
databricks auth profiles          # never echoes secrets
terraform version
```

`env | grep -i DATABRICKS` returning a stale `DATABRICKS_HOST` or `DATABRICKS_TOKEN` is the most common cause of a confusing provider auth failure. Unset them.

### 2. Permission sweep

Read-only. Returns which deployment topologies the caller's IAM permissions support, before any HCL exists.

```bash
bash precheck-aws.sh
```

### 3. Invoke the skill

Hand the skill the collected inputs and let it run its own intake for anything missing. It writes the HCL, then runs `terraform init` and `terraform plan`.

### 4. Plan review

The skill stops here. Show the plan to the user and get an explicit approval before `terraform apply`. Resources created here cost money and are slow to unwind.

## Verify

```bash
# Workspace reached RUNNING
databricks account workspaces list --profile <name>-account -o json \
  | jq -r '.[] | select(.workspace_name | startswith("<prefix>")) | "\(.workspace_name)\t\(.workspace_status)"'

# Metastore exists in the region and is not an orphan
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, default_data_access_config_id}'

# Workspace-level auth reaches the new workspace
databricks current-user me --profile <name> -o json | jq -r '.userName'
```

Expect `RUNNING` for every workspace, a metastore with a non-null `default_data_access_config_id`, and a username back from the workspace profile.

Then run all three paths from `databricks-deployment-verification`: classic cluster, serverless SQL warehouse, serverless notebook job, each doing CREATE, INSERT, SELECT, DROP on a Unity Catalog table. Start the classic cluster early; cold start is 10 to 15 minutes.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `400 BAD_REQUEST: Failed to get oauth access token` | SP is not an account admin, or the secret is wrong | Confirm the Account admin role on the Roles tab, regenerate the secret |
| Provider hits the wrong host | `DATABRICKS_HOST` or `DATABRICKS_TOKEN` set in the shell | `unset` both, re-run |
| `PERMISSION_DENIED: User is not an owner of Metastore` | The SP cannot create catalogs | Add the SP to the metastore admin group, or ``GRANT CREATE CATALOG ON METASTORE TO `<sp>` `` |
| Apply fails on IAM or VPC | AWS principal lacks IAM, S3, or VPC create rights | Run `precheck-aws.sh` and report the gaps rather than retrying |
| Multiple metastores returned for the region | Orphan metastores from earlier deploys | Do not silently reuse one. Report the list and let the user choose to adopt, delete, or deploy a distinctly named new one. |

## Next

- **Do next:** [Create groups](/docs/02-infra-setup/create-groups)
- **Manual fallback:** [Starter Journey: AWS console wizard](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/aws/manual)
- **Reference:** [Databricks on AWS administration](https://docs.databricks.com/aws/en/admin/)
