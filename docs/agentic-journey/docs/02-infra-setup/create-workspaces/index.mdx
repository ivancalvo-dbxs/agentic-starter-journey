---
sidebar_position: 0
sidebar_label: Create workspaces
description: Provision Databricks workspaces with databricks-platform-provisioning. Pick the page for the target cloud.
---

# Create workspaces

**Goal:** one workspace per environment, each with its own network, plus a Unity Catalog metastore in the region.

**Skill:** `databricks-platform-provisioning` (ai-platform-kit). It writes the Terraform from the requirements rather than filling in a fixed template.

## Pick the cloud

Auth differs enough per cloud that the pages are separate. Read only the one for the target cloud, and open the matching `AWS.md`, `AZURE.md`, or `GCP.md` in the skill directory. Reading the other clouds' files adds noise.

| Cloud | Page | Databricks provider auth |
|---|---|---|
| AWS | [AWS](/docs/02-infra-setup/create-workspaces/aws) | OAuth M2M with an account-admin service principal |
| Azure | [Azure](/docs/02-infra-setup/create-workspaces/azure) | `auth_type = "azure-cli"` on every provider block |
| GCP | [GCP](/docs/02-infra-setup/create-workspaces/gcp) | `auth_type = "google-id"` with service account impersonation |

## The workspace layout

Default to three workspaces: development, staging, production, each in its own VPC or VNet. A workspace cannot change region or merge with another after creation, so the layout is a one-way decision.

For a POC, one workspace is fine. Say so, and note that adding staging and production later means a fresh deploy, not a migration.

## Network posture

`databricks-platform-provisioning` recommends VPC/VNet injection with Secure Cluster Connectivity (no public IPs on cluster nodes) as the default. That is production-grade for most compliance frameworks.

Do not propose Private Link unless the user asks for it or names a framework that implies it (HIPAA, FedRAMP, PCI-DSS). If they do, hand off to `databricks-private-networking` and ask whether they want backend-only or full Private Link, since full Private Link makes the workspace UI reachable only from inside the private network.

## Manual and SRA fallbacks

| Path | Status |
|---|---|
| Agentic | This section. `databricks-platform-provisioning` writes and runs the Terraform. |
| Manual console wizard | No agentic path: a browser wizard. Use it when the user wants to see resources appear, or when their permissions block Terraform. [Starter Journey: AWS](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/aws/manual), [Azure](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/azure/manual), [GCP](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/create-workspaces/gcp/manual). |
| Security Reference Architecture (SRA) | Databricks' own hardened Terraform module, [databricks/terraform-databricks-sra](https://github.com/databricks/terraform-databricks-sra). Not driven by a skill. Point the user at it when they need a pre-audited baseline rather than generated HCL. |

## Pre-flight permission check

Before writing any HCL, offer the read-only sweep that ships with the skill. It returns which deployment topologies the user's cloud permissions actually support, which is cheaper than finding out during `apply`.

```bash
# Scripts ship with ai-platform-kit under platform-provisioning/scripts/
bash precheck-aws.sh      # or precheck-azure.sh / precheck-gcp.sh
```

## Verify

After `terraform apply`, before anything else:

```bash
databricks account workspaces list --profile <name>-account -o json \
  | jq -r '.[] | "\(.workspace_name)\t\(.workspace_status)"'
```

Expect every workspace to report `RUNNING`. `PROVISIONING` means wait; `FAILED` means read `workspace_status_message`.

Then run all three paths from `databricks-deployment-verification`. Section 2 is not done until classic compute reads and writes a Unity Catalog table.

## Next

- **Do next:** the page for your cloud, then [Create groups](/docs/02-infra-setup/create-groups)
- **Reference:** [Databricks Terraform provider](https://registry.terraform.io/providers/databricks/databricks/latest/docs)
