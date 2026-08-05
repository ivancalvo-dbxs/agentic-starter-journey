---
description: Provision workspaces, catalogs, and governed access to customer object storage with ai-platform-kit. All Terraform, run outside the workspace.
---

# 1. Infra Setup

## Mental Model

Infra Setup is one-time platform work per organization.
Databricks manages the platform through Terraform, not the workspace UI.
This project drives that Terraform with the `ai-platform-kit` skill library, which writes and applies it for the coding agent.
Everything here lives outside any project repo, at the account and metastore layer.

## Run in this order

The order is load-bearing. Prerequisites must pass before workspaces can be created. Workspaces must exist before catalogs. Catalogs must exist before governed object storage access.

| Order | Page | Skill | Status |
|---|---|---|---|
| 1 | Pre-requisites | (check page) | Pending |
| 2 | Workspaces | `databricks-platform-provisioning` | Pending |
| 3 | Catalogs | `databricks-unity-catalog-setup` | Pending |
| 4 | Cloud Object Storage access | `databricks-unity-catalog-setup` | Pending |

Pages are linked as they are added.

## Next

- **Reference:** [Databricks administration](https://docs.databricks.com/aws/en/admin/)
