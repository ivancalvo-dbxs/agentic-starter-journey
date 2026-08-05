---
sidebar_position: 0
sidebar_label: How to use this site
description: How an agent reads an Agentic Journey page, which skill library covers which step, and two worked interaction examples.
---

# How to use this site

**Goal:** understand the page contract before executing any section.

**Audience:** the coding agent, not the human. A human sends you a page URL and an outcome. You read the page, collect the inputs it names, invoke the skill it names, and run its verification command.

## The page contract

Every journey page has the same five blocks. Read them in order.

| Block | What you do with it |
|---|---|
| **Goal** | The single outcome the page produces. If the user asked for something else, you are on the wrong page. |
| **Skill** | The exact skill to invoke, and which library ships it. Do not improvise around it. |
| **Inputs** | A table of values. The `Source` column says whether the value comes from the human or you derive it. Ask for every human-sourced value in one message before running anything. |
| **Run** | The commands or the skill invocation. |
| **Verify** | A runnable check plus its expected output. Do not report success without running it. |

Pages never tell you to confirm something visually in a UI. If a step has no agentic path, the page says so and links the human [Starter Journey](https://databricks-solutions.github.io/starter-journey/) page as the manual fallback.

## The two skill libraries

Install both before starting. See [1. Prerequisites](/docs/01-prerequisites/).

| Library | Owns | Journey sections |
|---|---|---|
| [ai-platform-kit](https://github.com/databricks-solutions/ai-platform-kit) | The platform: workspaces, metastore, catalogs, groups, storage credentials, external locations, networking | 2, 4, 5 |
| [databricks-agent-skills](https://github.com/databricks/databricks-agent-skills) | What runs on the platform: pipelines, jobs, DABs, SQL, metric views, dashboards, Genie, ML, agents | 3, 6 to 13 |

ai-platform-kit writes Terraform and runs it. databricks-agent-skills writes bundle YAML and source files and deploys them with the Databricks CLI. The boundary is the workspace edge: outside it is Terraform, inside it is DABs.

## Where a Databricks project becomes its own repo

Sections 2 to 5 configure the account and the platform. They are one-time work per organization, and they do not live in a project repo.

Section 6 is the split point. From there on, every asset you create belongs to one bundle in one Git repo, and section 13 wires that repo to CI/CD. One repo, one bundle, one owning team. See [6. Build the first pipeline](/docs/06-build-first-pipeline/project-repo).

## Interaction 1: provision a workspace

A user sends a page URL and asks what you need from them.

```text
I want to create an AWS workspace as listed on
https://ivancalvo-dbxs.github.io/agentic-journey/docs/02-infra-setup/create-workspaces/aws/

Let me know what input values you need from me and how should I fill those out.
```

What you do:

1. Read [Create workspaces: AWS](/docs/02-infra-setup/create-workspaces/aws).
2. Run the prerequisite checks from [1. Prerequisites](/docs/01-prerequisites/). Report anything missing with its install command.
3. Ask for every human-sourced input on that page in one message: Databricks account ID, AWS CLI profile, region, workspace names, network posture. Explain how to obtain each.
4. Invoke `databricks-platform-provisioning`. It writes the Terraform, runs `terraform init` and `plan`, and stops for the user to review the plan before `apply`.
5. Run the verification from [Create workspaces: AWS](/docs/02-infra-setup/create-workspaces/aws#verify), then the three compute paths from `databricks-deployment-verification`.

## Interaction 2: a new project, end to end

A user describes a whole project in one message.

```text
Let's start a new Databricks project in a new repo. I'd like to build an
ingestion pipeline that reads from this S3 path: s3://acme-landing/orders/,
populates 3 medallion schemas using SDP and incremental ingestion. After that,
metric views on top of the gold tables and lastly, a Genie Agent and dashboards
for analytics. Lastly, add CI/CD for GHA and DABs.
```

This spans six sections. Walk them in order, and ask the questions each page lists before you write anything.

| Order | Page | Produces |
|---|---|---|
| 1 | [5. Access your data](/docs/05-access-your-data) | Storage credential plus external location over `s3://acme-landing/orders/`, via `databricks-unity-catalog-setup` |
| 2 | [6. Build the first pipeline: project repo](/docs/06-build-first-pipeline/project-repo) | New Git repo with a `databricks.yml` bundle and dev/staging/prod targets |
| 3 | [6. Build the first pipeline: pipeline resource](/docs/06-build-first-pipeline/pipeline-resource) | Bronze, silver, gold SDP pipeline with incremental ingestion and expectations, as a bundle resource |
| 4 | [8. Unified analytics: metric views](/docs/08-unified-analytics/metric-views) | Metric views over the gold tables, shipped as a SQL task in a bundle job |
| 5 | [8. Unified analytics: dashboards](/docs/08-unified-analytics/dashboards) and [Genie Agents](/docs/08-unified-analytics/genie-agents) | Dashboard and Genie Agent as bundle resources |
| 6 | [13. CI/CD and DevOps: GitHub Actions](/docs/13-ci-cd-devops/github-actions) | Validate, test, deploy workflow with per-environment bundle variables |

**Output:** a repo whose `databricks.yml` and `resources/*.yml` define every asset above.

**Outcome:** those resources deployed to the dev target for the user to test, with the CI/CD workflow targeting staging and production.

Deploy to dev yourself. Never deploy to staging or production from your local session: that is what the CI/CD workflow is for.

## Next

- **Do next:** [1. Prerequisites](/docs/01-prerequisites/)
- **Reference:** [Databricks CLI](https://docs.databricks.com/aws/en/dev-tools/cli/)
