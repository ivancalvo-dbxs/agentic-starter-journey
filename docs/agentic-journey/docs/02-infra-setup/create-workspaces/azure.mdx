---
sidebar_label: Azure
description: Provision a Databricks workspace on Azure with databricks-platform-provisioning. Inputs, run sequence, and verification.
---

# Create workspaces: Azure

**Goal:** an Azure Databricks workspace with VNet injection and Secure Cluster Connectivity, plus a Unity Catalog metastore in the region.

**Skill:** `databricks-platform-provisioning` (ai-platform-kit). Read its `SKILL.md`, then `AZURE.md`, then `azure-1-auth.md` and `azure-2-deploy.md`. Do not read the AWS or GCP files.

## Prerequisites

- [1. Prerequisites](/docs/01-prerequisites/) passing, including `terraform version` at 1.9.0 or later.
- `az login` complete, on the tenant that hosts the Databricks account.
- Contributor on the target subscription or resource group, enough to create a VNet, storage accounts, and an Access Connector.

Azure templates authenticate through the Azure CLI session, so no Databricks service principal is required. That is the main difference from AWS.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Subscription ID | Human | `az account show --query id -o tsv`. Confirm it is the right subscription if they have several. |
| Tenant ID | Human | `az account show --query tenantId -o tsv` |
| Azure region | Human | For example `eastus` |
| Databricks account ID | Human | [accounts.azuredatabricks.net](https://accounts.azuredatabricks.net), top-right user menu |
| Resource group | Human | New or existing. For existing, the name. |
| Environment strategy | Human | One workspace, or dev / staging / prod |
| Purpose | Human | POC or production |
| Existing VNet? | Human | New VNet, or existing. For existing: VNet name, resource group, and the two delegated subnet names (host and container). |
| Resource prefix | You derive | Storage account names are globally unique and alphanumeric only, so `st<prefix>catalogdev`. Never reuse a prefix. |

:::warning
If the user has more than one Azure tenant, confirm which one hosts the Databricks account before deploying. A tenant mismatch between the `azurerm` and `databricks` providers is the most common Azure failure, and it surfaces late with an unhelpful error. Every `databricks` provider block needs `azure_tenant_id` set explicitly, including the workspace-aliased one.
:::

## Run

### 1. Pre-flight

```bash
az account show
env | grep -i DATABRICKS               # conflicting env vars break provider auth
cat ~/.databrickscfg 2>/dev/null       # a DEFAULT profile can shadow the intended one
terraform version
```

For a headless session use `az login --use-device-code` and hand the code to the user.

### 2. Permission sweep

```bash
bash precheck-azure.sh
```

### 3. Invoke the skill

Pass the collected inputs. The skill writes the HCL with `auth_type = "azure-cli"` and `azure_tenant_id` on every provider block, then runs `terraform init` and `terraform plan`.

### 4. Plan review

The skill stops for a mandatory plan review. Get explicit approval before `terraform apply`.

## Verify

```bash
# Workspace reached RUNNING at the Databricks account level
databricks account workspaces list --profile <name>-account -o json \
  | jq -r '.[] | select(.workspace_name | startswith("<prefix>")) | "\(.workspace_name)\t\(.workspace_status)"'

# Azure resource provisioned
az databricks workspace show \
  --name <prefix>-dev --resource-group <rg> \
  --query '{state:provisioningState, url:workspaceUrl, noPublicIp:parameters.enableNoPublicIp.value}'

# Metastore in the region
databricks account metastores list --profile <name>-account -o json \
  | jq '.[] | select(.region=="<region>") | {name, metastore_id, default_data_access_config_id}'
```

Expect `RUNNING`, `provisioningState: Succeeded`, `noPublicIp: true` for an injected deploy, and a metastore with a non-null `default_data_access_config_id`.

Then run all three paths from `databricks-deployment-verification`. Start the classic cluster early.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Provider auth fails against the accounts API | `azure_tenant_id` missing on a provider block | Add it to every `databricks` provider block, including the workspace alias |
| `The subscription is not registered to use namespace 'Microsoft.Databricks'` | Resource provider not registered | `az provider register --namespace Microsoft.Databricks` |
| Workspace created but the catalog step cannot connect | Workspace provider block still pointing at the accounts host | The catalog provider needs the workspace URL, not `accounts.azuredatabricks.net` |
| Subnet delegation errors on an existing VNet | Subnets not delegated to `Microsoft.Databricks/workspaces`, or too small | Delegate both subnets; size them for peak node count |
| Multiple metastores returned for the region | Orphans from earlier deploys | Report the list, let the user choose. Do not silently reuse. |

## Next

- **Do next:** [Create groups](/docs/02-infra-setup/create-groups)
- **Manual fallback:** [Starter Journey: Azure portal](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/azure/manual)
- **Reference:** [Azure Databricks administration](https://learn.microsoft.com/en-us/azure/databricks/admin/)
