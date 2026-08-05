---
sidebar_label: GitHub Actions
description: Validate, test, and deploy the bundle from GitHub Actions, passing per-environment values through BUNDLE_VAR_ variables.
---

# GitHub Actions

**Goal:** a workflow that validates the bundle, runs unit tests, and deploys to staging and production, with per-environment values coming from GitHub environments.

**Prerequisites:** [13. CI/CD and DevOps](/docs/13-ci-cd-devops/) inputs collected. The bundle deploys cleanly to dev.

## Three stages

| Stage | Command | Catches |
|---|---|---|
| Validate | `databricks bundle validate --strict` | Config errors, unresolved variables, unknown keys |
| Test | `pytest`, or the project's runner | Logic errors in pipeline and notebook source |
| Deploy | `databricks bundle deploy` | Deploys the resources |

Validate on every pull request.
Deploy only on a merge to the branch that maps to an environment.
A pull request that can deploy is a pull request that can break production.

## Where the values come from

This is the part worth getting right, because it is what makes one workflow file serve every environment.

| Value | Source | Mechanism |
|---|---|---|
| Workspace host | GitHub secret or variable | `DATABRICKS_HOST` |
| SP credentials | GitHub secret | `DATABRICKS_CLIENT_ID`, `DATABRICKS_CLIENT_SECRET` |
| Bundle target | GitHub environment variable | `--target` argument |
| Catalog, schema, warehouse | GitHub environment variable | `BUNDLE_VAR_<name>` |

Any variable declared in `databricks.yml` can be set from the environment as `BUNDLE_VAR_<name>`.
A variable named `catalog` is set by `BUNDLE_VAR_catalog`.
That is how the catalog and schema values live in GitHub environments instead of inside the bundle, so promoting a change to production does not mean editing YAML.

Set up one GitHub environment per Databricks target (`staging`, `production`), each with its own variables and secrets.
Add a required-reviewer protection rule on production.

## The workflow

```yaml
# .github/workflows/deploy.yml
name: Bundle CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main, staging]

jobs:
  validate:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: databricks/setup-cli@main

      - name: Validate bundle
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_CLIENT_ID: ${{ secrets.DATABRICKS_CLIENT_ID }}
          DATABRICKS_CLIENT_SECRET: ${{ secrets.DATABRICKS_CLIENT_SECRET }}
          BUNDLE_VAR_catalog: ${{ vars.CATALOG }}
          BUNDLE_VAR_schema_prefix: ${{ vars.SCHEMA_PREFIX }}
          BUNDLE_VAR_warehouse_id: ${{ vars.WAREHOUSE_ID }}
        run: databricks bundle validate --strict --target ${{ vars.BUNDLE_TARGET }}

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements-dev.txt
      - run: pytest tests/ -v

  deploy-staging:
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    needs: [validate, test]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: databricks/setup-cli@main
      - name: Deploy
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_CLIENT_ID: ${{ secrets.DATABRICKS_CLIENT_ID }}
          DATABRICKS_CLIENT_SECRET: ${{ secrets.DATABRICKS_CLIENT_SECRET }}
          BUNDLE_VAR_catalog: ${{ vars.CATALOG }}
          BUNDLE_VAR_schema_prefix: ${{ vars.SCHEMA_PREFIX }}
          BUNDLE_VAR_warehouse_id: ${{ vars.WAREHOUSE_ID }}
        run: databricks bundle deploy --target staging

  deploy-production:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [validate, test]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: databricks/setup-cli@main
      - name: Deploy
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_CLIENT_ID: ${{ secrets.DATABRICKS_CLIENT_ID }}
          DATABRICKS_CLIENT_SECRET: ${{ secrets.DATABRICKS_CLIENT_SECRET }}
          BUNDLE_VAR_catalog: ${{ vars.CATALOG }}
          BUNDLE_VAR_schema_prefix: ${{ vars.SCHEMA_PREFIX }}
          BUNDLE_VAR_warehouse_id: ${{ vars.WAREHOUSE_ID }}
        run: databricks bundle deploy --target production
```

`databricks/setup-cli@main` installs the CLI in one step, so no manual install script is needed on the runner.

The `environment:` key on each job is what makes `vars.CATALOG` resolve differently per environment, and what makes the production protection rule apply.

Note that the `validate` job also declares an environment.
Validation needs the variables to resolve, so without one, `--strict` fails on unresolved variables rather than on anything real.

## Definition-applying jobs

Deploying registers resources.
It does not run the jobs that apply definitions, so a metric view whose SQL changed needs its job run after the deploy:

```yaml
      - name: Register metric views
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_CLIENT_ID: ${{ secrets.DATABRICKS_CLIENT_ID }}
          DATABRICKS_CLIENT_SECRET: ${{ secrets.DATABRICKS_CLIENT_SECRET }}
          BUNDLE_VAR_catalog: ${{ vars.CATALOG }}
          BUNDLE_VAR_schema_prefix: ${{ vars.SCHEMA_PREFIX }}
          BUNDLE_VAR_warehouse_id: ${{ vars.WAREHOUSE_ID }}
        run: databricks bundle run <project>_kpis --target production
```

Do not add this for scheduled data jobs.
A deploy triggering a full pipeline run is a surprise, and an expensive one.

## Verify

Locally, before pushing, confirm the variable mechanism works:

```bash
BUNDLE_VAR_catalog=stg \
BUNDLE_VAR_schema_prefix=<project> \
BUNDLE_VAR_warehouse_id=<id> \
  databricks bundle validate --strict --target staging --profile <name> -o json \
  | jq '{target: .bundle.target, catalog: .variables.catalog.value}'
```

Expect `staging` and `stg`.
If the catalog comes back as the bundle default instead, the variable name and the `BUNDLE_VAR_` suffix do not match.

Then confirm the service principal can actually deploy, which is the failure that otherwise appears first in CI:

```bash
DATABRICKS_HOST=<staging-host> \
DATABRICKS_CLIENT_ID=<client-id> \
DATABRICKS_CLIENT_SECRET=<secret> \
  databricks current-user me -o json | jq -r '.userName'
```

Expect the SP's application ID.

After pushing:

```bash
gh run list --workflow=deploy.yml --limit 5
gh run view <run-id> --log-failed
```

And confirm the deploy landed in the target workspace:

```bash
databricks bundle summary --target staging --profile <name> -o json \
  | jq -r '.resources | to_entries[] | "\(.key): \(.value | keys | join(", "))"'
```

Expect every resource the bundle declares.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `cannot resolve variable` in CI, fine locally | `BUNDLE_VAR_<name>` not set, or the name does not match the declared variable | The suffix must match the variable name exactly, including case |
| `validate` fails on the PR with no real error | Validate job has no `environment`, so the variables do not resolve | Add `environment:` to the validate job |
| Deploy authenticates as nobody | Secrets set at repo level while the job uses an environment that lacks them | Set them on the environment, or reference repo secrets |
| Production deployed from a feature branch | `if:` condition missing or too loose | Gate on both `github.ref` and `github.event_name == 'push'` |
| Resources renamed with a user prefix in production | Production target left in `mode: development` | Set `mode: production` |
| Deploy succeeds, behaviour unchanged | A definition-applying job was not run | Add a `bundle run` step for those jobs only |
| Schedules do not fire after deploy | `pause_status` left `PAUSED`, or the target is in development mode | Set `UNPAUSED` on production targets |
| `PERMISSION_DENIED` on deploy | SP not assigned to the workspace, or lacks Unity Catalog grants | Assign it and grant. See [Create groups](/docs/02-infra-setup/create-groups). |

## Next

- **Do next:** [Other providers](/docs/13-ci-cd-devops/other-providers)
- **Reference:** [CI/CD with GitHub Actions](https://docs.databricks.com/aws/en/dev-tools/ci-cd/github)
