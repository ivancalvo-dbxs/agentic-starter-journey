---
sidebar_position: 0
sidebar_label: 2. Infra setup
description: Provision workspaces, account-level groups, and metastore ownership with ai-platform-kit.
---

# 2. Infra setup

**Goal:** workspaces provisioned, account-level groups created, metastore owned by a group.

**Owned by:** [ai-platform-kit](https://github.com/databricks-solutions/ai-platform-kit). This whole section is Terraform, run outside the workspace.

## Run in this order

The order is load-bearing. Groups must exist before the metastore can be owned by one, and the metastore has to exist before section 4 can create catalogs in it.

| Order | Page | Skill | Produces |
|---|---|---|---|
| 1 | [Create workspaces](/docs/02-infra-setup/create-workspaces/) | `databricks-platform-provisioning` | Workspaces with VPC/VNet injection and Secure Cluster Connectivity, plus a metastore |
| 2 | [Create groups](/docs/02-infra-setup/create-groups) | `databricks-identity-governance` | Account-level SCIM groups and a deployment service principal |
| 3 | [Metastore owner](/docs/02-infra-setup/metastore-owner) | `databricks-unity-catalog-setup` | Metastore owned by the admin group, not a person |

## Inputs to collect before starting

Ask for all of these in one message. Every value is human-sourced except the prefix.

| Input | Source | How to obtain |
|---|---|---|
| Cloud | Human | `aws`, `azure`, or `gcp` |
| Region | Human | Cloud region string, `us-east-1` / `eastus` / `us-central1` |
| Databricks account ID | Human | Account console, top-right user menu |
| Environment strategy | Human | One workspace, or separate dev / staging / prod |
| Purpose | Human | POC or production. Production gets network injection and hardening; POC can take defaults. |
| Resource prefix | You derive | From the customer or project name. Must be globally unique per cloud account and never reused across deploys. |

Cloud-specific credentials are on the per-cloud page. `databricks-platform-provisioning` also runs its own intake, so let the skill ask rather than pre-answering for the user.

:::danger
`terraform apply` creates billable cloud resources. The skill stops for a mandatory plan review. Never approve the plan on the user's behalf, and never run `terraform destroy` without explicit confirmation naming what will be destroyed.
:::

## Verification is not optional

`databricks-deployment-verification` requires all three compute paths against a Unity Catalog table before a deployment counts as verified:

1. Classic cluster with `data_security_mode = "SINGLE_USER"`
2. Serverless SQL warehouse (PRO)
3. Serverless notebook job

One serverless pass is not verification. Classic cold-start is 10 to 15 minutes, so start it before the last Terraform step finishes. Read that skill before reporting section 2 done.

## Not covered here

| Step | Where |
|---|---|
| SSO to an external identity provider | Manual. [Starter Journey: Activate SSO](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/activate-sso). No skill in either library covers the IdP side. |
| SCIM provisioning from an IdP | Manual on the IdP side. `databricks-identity-governance` creates groups via the Account SCIM API, but wiring Okta or Entra ID to push them is console work: [Starter Journey: Add groups with SCIM](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/add-groups/scim). |
| Private Link, NCC, PSC | `databricks-private-networking`. Only when the user asks or names a compliance framework that implies it. |
| SQL warehouses, cluster policies, secret scopes, IP access lists | `databricks-workspace-config`. Day-2 work, not blocking the journey. |

## Next

- **Do next:** [Create workspaces](/docs/02-infra-setup/create-workspaces/)
- **Reference:** [Databricks administration](https://docs.databricks.com/aws/en/admin/)
