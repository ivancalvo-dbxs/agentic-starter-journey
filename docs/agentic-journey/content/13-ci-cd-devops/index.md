---
sidebar_position: 0
sidebar_label: 13. CI/CD and DevOps
description: Wire the project bundle to CI/CD so validate, test, and deploy run on a pipeline instead of a laptop.
---

# 13. CI/CD and DevOps

**Goal:** the project's bundle deployed to staging and production by a pipeline, never from a local session.

**Prerequisites:** the project's DABs resources exist and deploy cleanly to dev, from sections 6 through 12.

Everything up to here deployed to the dev target from your session.
That is correct for dev and wrong for anything else: a production deploy from a laptop has no review gate, no test run, and no record of what changed.
This section moves the staging and production deploys onto a pipeline.

## The two layers, one line

| Layer | Covers | Tool |
|---|---|---|
| Platform infrastructure | Accounts, networks, metastores, workspaces, cloud IAM. Anything outside a workspace. | Terraform, from section 2 |
| Databricks project | Jobs, pipelines, schemas, dashboards, Genie Agents, models, apps. Anything inside a workspace. | DABs, from section 6 on |

The line is the workspace edge.
Most CI/CD confusion in Databricks comes from crossing it, either provisioning workspaces from a project pipeline or clicking project assets into a workspace by hand.

## One repo, one bundle, one team

Keep a 1:1 relationship between a Git repo and a Databricks project, with trunk-based development: `main` always deployable, short-lived feature branches, quick merges.

The alternative, every project in one shared repo, breaks predictably:

| Concern | Shared repo | Isolated repo |
|---|---|---|
| Merge conflicts | Unrelated teams touch shared bundle targets and CI config | Each team owns every file in their repo |
| CI duration | One pipeline change validates every project | CI runs only for what changed |
| Ownership | A failed deploy has no clear owner, and a rollback drags in unrelated assets | The team that owns the repo owns the deploy |
| Release cadence | One team's hotfix waits behind another's long-running branch | Each team ships on its own schedule |

## In this section

| Page | Produces |
|---|---|
| [GitHub Actions](/docs/13-ci-cd-devops/github-actions) | The worked example: validate, test, deploy, with per-environment variables |
| [Other providers](/docs/13-ci-cd-devops/other-providers) | The same three stages on Azure DevOps, GitLab CI, and Bitbucket |

GitHub Actions is the worked example.
The mechanics are identical elsewhere: install the CLI, set auth environment variables, run `bundle validate` then `bundle deploy`.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| CI/CD provider | Human | GitHub Actions, Azure DevOps, GitLab CI, Bitbucket |
| Branch to environment mapping | Human | For example `main` to production, `staging` to staging. Confirm rather than assuming. |
| Deployment service principal | You derive | The `<prefix>-deployer` SP from [Create groups](/docs/02-infra-setup/create-groups) |
| SP OAuth client ID and secret | Human | Account console. These go in CI secrets, never in the repo. |
| Workspace host per environment | You derive | `databricks account workspaces list -o json` |
| Catalog and schema per environment | You derive | From [Create catalogs](/docs/04-data-governance-strategy/create-catalogs) |
| Manual approval before production? | Human | Recommended. A GitHub environment protection rule, or the equivalent. |

:::danger
Never commit an OAuth client secret, a PAT, or a workspace token to the repo.
They go in the provider's secret store.
If a secret has already been committed, say so plainly and have it rotated: removing the file does not un-leak it, because the git history still holds it.
:::

## Next

- **Do next:** [GitHub Actions](/docs/13-ci-cd-devops/github-actions)
- **Manual fallback:** [Starter Journey: CI/CD and DevOps](https://databricks-solutions.github.io/starter-journey/docs/14-ci-cd-devops/)
- **Reference:** [CI/CD on Databricks](https://docs.databricks.com/aws/en/dev-tools/ci-cd/)
