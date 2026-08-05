---
sidebar_label: Other providers
description: The same validate, test, deploy stages on Azure DevOps, GitLab CI, and Bitbucket.
---

# Other providers

**Goal:** the same three stages as [GitHub Actions](/docs/13-ci-cd-devops/github-actions), on whichever provider the user runs.

**Prerequisites:** read [GitHub Actions](/docs/13-ci-cd-devops/github-actions) first. It is the worked example, and everything below is the same mechanism with different syntax.

## What is actually provider-specific

Only four things.
Once they are mapped, the pipeline is the same.

| Concept | GitHub Actions | Azure DevOps | GitLab CI | Bitbucket |
|---|---|---|---|---|
| Install the CLI | `databricks/setup-cli@main` | Bash task running the install script | `before_script` running the install script | `script` step running the install script |
| Per-environment values | Environments with `vars` | Variable groups, or stage-scoped variables | Environment-scoped CI/CD variables | Deployment environments |
| Secrets | Environment secrets | Variable group linked to Key Vault, or secret variables | Masked, protected variables | Secured repository variables |
| Branch gating | `if: github.ref == ...` | `trigger.branches`, or stage conditions | `rules.if: $CI_COMMIT_BRANCH == ...` | `pipelines.branches.<name>` |

The commands never change:

```bash
databricks bundle validate --strict --target <target>
databricks bundle deploy --target <target>
```

Nor does the variable mechanism.
Any variable declared in `databricks.yml` is settable as `BUNDLE_VAR_<name>` from the environment, on every provider, because it is a CLI feature rather than a CI feature.

## Installing the CLI without the GitHub action

```bash
curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
databricks version
```

Pin a version in CI if reproducibility matters more than currency.
Keep the `databricks version` line: a runner that silently has no CLI produces a much worse error later.

## The environment variables every provider needs

Same set regardless of provider:

```bash
DATABRICKS_HOST                 # target workspace URL
DATABRICKS_CLIENT_ID            # deployment service principal
DATABRICKS_CLIENT_SECRET        # from the provider's secret store
BUNDLE_VAR_catalog              # per-environment
BUNDLE_VAR_schema_prefix        # per-environment
BUNDLE_VAR_warehouse_id         # per-environment
```

OAuth M2M with a service principal is the right credential shape everywhere.
Do not use a personal access token in CI: it is tied to a person, it expires, and the deploy history then attributes production changes to whoever generated it.

## Azure DevOps

Variable groups hold the per-environment values, and a group can be linked to Key Vault so secrets are never in the pipeline YAML.
Scope one group per environment and reference it from the matching stage.

Stage-level `condition` gates the deploy, and an environment with an approval check gives the production gate.

For a working Azure DevOps pipeline against a bundle, see [databricks-dab-examples knowledge-base](https://github.com/databricks-solutions/databricks-dab-examples/tree/main/knowledge-base).

## GitLab CI

Define the values as CI/CD variables scoped to an environment, and mark the secrets masked and protected.
Protected variables are only exposed to protected branches, which is the mechanism that stops a feature branch from reading production credentials.

Gate with `rules`:

```yaml
deploy-production:
  stage: deploy
  environment: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  script:
    - databricks bundle deploy --target production
```

## Bitbucket Pipelines

Deployment environments hold per-environment variables, and repository variables can be marked secured.
Branch-specific pipelines under `pipelines.branches.<name>` give the gating.

## Verify

Provider-independent, and worth running before trusting any pipeline.

```bash
# 1. The service principal can reach the target workspace
DATABRICKS_HOST=<host> \
DATABRICKS_CLIENT_ID=<id> \
DATABRICKS_CLIENT_SECRET=<secret> \
  databricks current-user me -o json | jq -r '.userName'

# 2. The variables resolve to the intended environment's values
DATABRICKS_HOST=<host> \
DATABRICKS_CLIENT_ID=<id> \
DATABRICKS_CLIENT_SECRET=<secret> \
BUNDLE_VAR_catalog=<catalog> \
BUNDLE_VAR_schema_prefix=<prefix> \
BUNDLE_VAR_warehouse_id=<id> \
  databricks bundle validate --strict --target <target> -o json \
  | jq '{target: .bundle.target, catalog: .variables.catalog.value}'
```

Expect the SP's application ID from the first, and the intended target and catalog from the second.
Both passing means the pipeline will work; a failure in CI after both pass is provider syntax, not Databricks.

After the first real run:

```bash
databricks bundle summary --target <target> --profile <name> -o json \
  | jq -r '.resources | to_entries[] | "\(.key): \(.value | keys | join(", "))"'
```

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `databricks: command not found` | Install step missing, or the CLI is not on PATH in a later step | Install in the same job, and keep the `databricks version` check |
| Auth works locally, fails in CI | PAT used instead of OAuth M2M, and it expired | Use a service principal with OAuth M2M |
| Variables empty in the deploy stage | Variable group or environment not linked to that stage | Link it per stage. Scoping is per-stage on every provider. |
| Feature branch reads production secrets | Variables not marked protected | Mark them protected, and restrict to protected branches |
| Deploy runs on every commit | Branch condition missing | Gate on the branch name and the event type |
| Same pipeline deploys two environments identically | One variable group used for both | One group or environment per target |

## Next

- **Reference:** [CI/CD on Databricks](https://docs.databricks.com/aws/en/dev-tools/ci-cd/), [bundle examples](https://github.com/databricks/bundle-examples)
- **Back to:** [How to use this site](/docs/how-to-use)
