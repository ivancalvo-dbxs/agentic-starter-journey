---
sidebar_position: 0
sidebar_label: 6. Build the first pipeline
description: Where a Databricks project becomes its own repo, and the first pipeline resource lands in its bundle.
---

# 6. Build the first pipeline

**Goal:** a new Git repo holding a bundle, with a medallion pipeline as its first resource, deployed to the dev target.

**Prerequisites:** [5. Access your data](/docs/05-access-your-data) complete, so there is a governed path to read from.

## The split point

Everything up to here configured the account and the platform: workspaces, groups, catalogs, external locations.
That work is one-time per organization and does not belong in a project repo.

From this page on, every asset belongs to **one bundle in one Git repo**, owned by one team.
One repo, one bundle, one deployment boundary.
The alternative, one shared repo holding every project, breaks the moment a second team commits: unrelated teams collide in shared bundle targets, a change to one pipeline triggers validation for everything, and a failed deploy has no clear owner.

| Layer | Tool | Lives |
|---|---|---|
| Platform: accounts, networks, metastore, workspaces, IAM | Terraform, driven by ai-platform-kit | Platform repo, or wherever section 2 ran |
| Project: pipelines, jobs, schemas, dashboards, models, apps | DABs, driven by databricks-agent-skills | This project's repo |

The line is the workspace edge.

## In this section

| Order | Page | Skill | Produces |
|---|---|---|---|
| 1 | [Project repo](/docs/06-build-first-pipeline/project-repo) | `databricks-dabs` | New repo with `databricks.yml` and dev, staging, prod targets |
| 2 | [Pipeline resource](/docs/06-build-first-pipeline/pipeline-resource) | `databricks-pipelines` | Bronze, silver, gold SDP pipeline as a bundle resource |

Do them in order.
The pipeline resource needs a bundle to live in.

## What you ask the user before writing anything

The pipeline shape follows from these answers, so collect them first.
[Pipeline resource](/docs/06-build-first-pipeline/pipeline-resource) has the full input table; these are the ones that change the design rather than fill in a name.

| Question | Why it changes the design |
|---|---|
| Batch or continuously arriving data? | Streaming source means a streaming table with Auto Loader. Batch means a materialized view. The pair cannot be swapped later without dropping the table. |
| Full reload each run, or incremental? | Incremental means Auto Loader on ingest. Upserts or change tracking mean Auto CDC. |
| Which target catalog and schemas? | Must be the medallion schemas from [Create catalogs](/docs/04-data-governance-strategy/create-catalogs), not new ones |
| What must be true of the data? | Becomes expectations. Ask for the actual rules ("order_id never null", "amount above zero"), not "good quality". |
| SQL or Python? | Sinks, ForEachBatch sinks, CDC from snapshots, and custom data sources are Python-only. Say so if they ask for one in SQL. |

## Next

- **Do next:** [Project repo](/docs/06-build-first-pipeline/project-repo)
- **Reference:** [Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)
