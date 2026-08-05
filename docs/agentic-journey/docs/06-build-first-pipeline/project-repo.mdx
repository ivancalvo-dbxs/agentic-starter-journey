---
sidebar_label: Project repo
description: Create the project's own Git repo with a bundle and per-environment targets.
---

# Project repo

**Goal:** a new Git repo containing a valid `databricks.yml` with dev, staging, and production targets, validating clean against dev.

**Skill:** `databricks-dabs` (databricks-agent-skills). Read its `references/bundle-structure.md` before writing YAML.

**Prerequisites:** [5. Access your data](/docs/05-access-your-data) complete. A catalog and medallion schemas exist.

One repo per Databricks project.
Create it now, empty of resources, and validate it before adding the pipeline.
A bundle that fails `validate` with no resources in it is a config problem; the same failure after three resources land is a hunt.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Project name | Human | Becomes the bundle name and the repo name. Kebab-case, `marketing-c360`. |
| Repo location | Human | Where to create it, and whether they want a remote. Ask before creating anything on GitHub. |
| Target catalogs per environment | Human | From [Create catalogs](/docs/04-data-governance-strategy/create-catalogs). Usually `dev`, `stg`, `prod`, or the prefixed variants. |
| Target schema | You derive | `<project>_bronze` / `_silver` / `_gold` |
| Workspace host per environment | You derive | `databricks account workspaces list -o json`, then `deployment_name` |
| Deployment service principal | You derive | The `<prefix>-deployer` SP from [Create groups](/docs/02-infra-setup/create-groups). Staging and production run as this, not as a person. |

:::warning
Do not create a GitHub repo without asking.
Creating a repo, and especially pushing to a remote, is outward-facing and hard to undo.
Initialize locally with `git init`, and let the user decide on the remote.
:::

## Structure

```text
<project>/
├── databricks.yml            ← bundle name, variables, targets
├── resources/
│   └── <name>.pipeline.yml   ← one file per resource, added next page
├── src/
│   └── ...                   ← pipeline source, notebooks, Python
├── tests/
│   └── ...                   ← unit tests, run by CI in section 13
└── .github/workflows/        ← added in section 13
```

Resource files use `<name>.<resource_type>.yml`.
That naming is what `databricks-dabs` expects, and it keeps `resources/` readable once a project holds a pipeline, three jobs, a dashboard, and a Genie Agent.

## The bundle

Parameterize catalog, schema, and warehouse as variables.
Hardcoding them into resources is what makes a bundle undeployable to a second environment, and section 13 passes these same variables from CI environments.

```yaml
# databricks.yml
bundle:
  name: <project>

variables:
  catalog:
    description: Unity Catalog catalog for this target
  schema_prefix:
    description: Schema name prefix, medallion suffixes appended per layer
    default: <project>
  warehouse_id:
    description: SQL warehouse for SQL tasks and dashboards

include:
  - resources/*.yml

targets:
  dev:
    mode: development
    default: true
    workspace:
      host: https://<dev-workspace>.cloud.databricks.com
    variables:
      catalog: dev

  staging:
    mode: production
    workspace:
      host: https://<staging-workspace>.cloud.databricks.com
      root_path: /Workspace/Shared/.bundle/${bundle.name}/${bundle.target}
    run_as:
      service_principal_name: <prefix>-deployer
    variables:
      catalog: stg

  prod:
    mode: production
    workspace:
      host: https://<prod-workspace>.cloud.databricks.com
      root_path: /Workspace/Shared/.bundle/${bundle.name}/${bundle.target}
    run_as:
      service_principal_name: <prefix>-deployer
    variables:
      catalog: prod
```

`mode: development` prefixes resource names with the deploying user and pauses schedules, so two engineers can deploy to dev without colliding.
`mode: production` does neither, which is why staging and production must run as a service principal rather than as whoever deployed last.

## Run

```bash
mkdir <project> && cd <project>
git init

# write databricks.yml and create the directories
mkdir -p resources src tests

databricks bundle validate --strict --target dev --profile <name>
```

`--strict` is the point.
Without it, unknown keys pass silently and surface as a confusing deploy failure later.

Then commit before adding resources, so the working bundle is a recoverable point:

```bash
git add -A && git commit -m "Bundle scaffold with dev, staging, prod targets"
```

## Verify

```bash
# Validates clean and resolves the variables you expect
databricks bundle validate --strict --target dev --profile <name> -o json \
  | jq '{name: .bundle.name, target: .bundle.target, catalog: .variables.catalog.value}'

# Every target resolves, not just dev
for t in dev staging prod; do
  echo -n "$t: "
  databricks bundle validate --strict --target "$t" --profile <name> >/dev/null 2>&1 \
    && echo OK || echo FAIL
done
```

Expect the bundle name, `dev`, and the dev catalog from the first command, and `OK` for all three targets from the second.

A `FAIL` on staging or production here is usually the service principal not existing or not having workspace access, not a YAML error.
Check with `databricks bundle validate --target staging` and read the message rather than guessing.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `unknown command "bundle"` | Legacy pip CLI on PATH | See [Databricks CLI](/docs/01-prerequisites/databricks-cli) |
| `cannot resolve variable` | Variable used in a resource but not declared in `databricks.yml` | Declare it under `variables:` |
| Validate passes on dev, fails on prod | Target missing a variable value, or the SP has no workspace access | Set the variable per target; assign the SP to the workspace |
| Two engineers overwrite each other in dev | Dev target not in `mode: development` | Set it. Development mode prefixes resources per user. |
| Paths resolve differently than expected | Relative paths resolve from the file that declares them, not the bundle root | Read `references/bundle-structure.md` on path resolution |

## Next

- **Do next:** [Pipeline resource](/docs/06-build-first-pipeline/pipeline-resource)
- **Reference:** [Bundle configuration](https://docs.databricks.com/aws/en/dev-tools/bundles/settings)
