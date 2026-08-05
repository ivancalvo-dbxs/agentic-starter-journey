---
sidebar_label: Databricks CLI
description: Install and authenticate the Databricks CLI, the transport for every command in this journey.
---

# Databricks CLI

**Goal:** a `databricks` binary on PATH at v0.296.0 or later, authenticated against the target host.

Every skill in [databricks-agent-skills](https://github.com/databricks/databricks-agent-skills) declares a CLI floor in its frontmatter (`databricks-core` requires v0.292.0, several product skills require v1.0.0, `databricks genie ask` requires v1.9.0). Install the newest version rather than tracking each floor.

## Install

```bash
# macOS / Linux (Homebrew)
brew tap databricks/tap && brew install databricks

# macOS / Linux (script)
curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh

# Windows
winget install Databricks.DatabricksCLI
```

:::warning
A `databricks` command that came from `pip install databricks-cli` is the legacy CLI. It has no `bundle` subcommand, so every DABs page in this journey fails against it. If `databricks version` prints something below `v0.200`, uninstall the pip package before installing the current CLI.
:::

Verify:

```bash
databricks version
```

Expect `Databricks CLI v0.296.0` or later.

## Authenticate

Two credential shapes. Pick by who is running.

| Situation | Method | Inputs |
|---|---|---|
| A human is at the keyboard | OAuth U2M | Workspace URL, plus a browser |
| CI/CD, or an unattended session | OAuth M2M (service principal) | Client ID, client secret, host |
| Account-level work (workspaces, groups, metastore) | Account profile | Account ID, account console host |

### OAuth U2M

```bash
databricks auth login --host https://<workspace>.cloud.databricks.com --profile <name>
```

This opens a browser. You cannot complete it yourself, so tell the user to finish the browser flow, then wait.

### OAuth M2M

```bash
export DATABRICKS_HOST=https://<workspace>.cloud.databricks.com
export DATABRICKS_CLIENT_ID=<client-id>
export DATABRICKS_CLIENT_SECRET=<client-secret>
```

### Account profile

Section 2 creates workspaces and account-level groups, which are account-scoped, not workspace-scoped. That needs a separate profile.

```bash
databricks auth login \
  --host https://accounts.cloud.databricks.com \
  --account-id <databricks-account-id> \
  --profile <name>-account
```

Account console host per cloud: `accounts.cloud.databricks.com` (AWS), `accounts.azuredatabricks.net` (Azure), `accounts.gcp.databricks.com` (GCP).

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Workspace URL | Human | The browser address when they open the workspace, `https://<id>.cloud.databricks.com` or `https://adb-<id>.<n>.azuredatabricks.net` |
| Databricks account ID | Human | Account console, top-right user menu |
| Profile name | You derive | Use the customer or project prefix, for example `acme` and `acme-account` |
| Client ID and secret | Human | Account console, service principal, then OAuth secrets. Never ask them to paste these into a file you commit. |

## Verify

```bash
databricks auth describe --profile <name>
databricks current-user me --profile <name>
```

Expect `auth describe` to print the host and a non-expired credential, and `current-user me` to return a JSON object with `userName`. A `default auth: cannot configure default credentials` error means the profile is wrong or the token expired.

Account profile check:

```bash
databricks account workspaces list --profile <name>-account -o json | jq 'length'
```

Expect an integer. `0` is valid on a fresh account.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `unknown command "bundle"` | Legacy pip CLI on PATH | `pip uninstall databricks-cli`, reinstall per above |
| `cannot configure default credentials` | No profile, or expired token | Re-run `databricks auth login` |
| `Error: invalid Databricks Account configuration` | Workspace profile used for an account command | Use the `-account` profile |
| Commands work but hit the wrong workspace | `DATABRICKS_HOST` in the environment overriding `--profile` | `unset DATABRICKS_HOST`, or pass the env vars explicitly |

## Next

- **Do next:** [Skill libraries](/docs/01-prerequisites/skill-libraries)
- **Reference:** [Databricks CLI authentication](https://docs.databricks.com/aws/en/dev-tools/cli/authentication)
