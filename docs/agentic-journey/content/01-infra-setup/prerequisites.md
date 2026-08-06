---
description: Install and verify the Databricks CLI, the cloud CLI, and both skill libraries before running any other page.
---

# Pre-requisites

## Mental Model

Every later page assumes three things work: the Databricks CLI is installed and authenticated, the cloud CLI for the target cloud is authenticated, and both skill libraries are visible to the agent harness.
Skipping this page fails mid-flight: Terraform stops mid-apply, and bundle deploys reject unauthenticated calls.

## Goal

Install anything missing, then confirm the three prerequisites every later page depends on.
Report what passed and what failed with the fix for each.

## Prerequisites

None. This is the first page.

## Skill

None. This is a check page, not a skill invocation.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Account host | Human | AWS: `https://accounts.cloud.databricks.com`. Azure: `https://accounts.azuredatabricks.net`. GCP: the accounts host for the cloud. Infra Setup starts here. There is no workspace URL yet. |
| Account-admin profile | Human | Named Databricks CLI profile that can call account APIs (`databricks account workspaces list`). |
| Target cloud | Human | `aws`, `azure`, or `gcp`. Drives which cloud CLI check to run. |
| Agent harness | You derive | `claude`, `codex`, `cursor`, `copilot`, `gemini`, `windsurf`, `opencode`, `kiro`, or `all`. Drives the ai-platform-kit `--agent` flag. |
| Skill directory | You derive | Directory this harness reads. Claude: `~/.claude/skills/`. Cursor: `~/.cursor/skills/`. Also check project `.claude/skills/` / `.cursor/skills/`. |

## Run

```bash
# 1. Databricks CLI installed and recent enough
databricks version

# 2. Named profiles; Valid=YES for the account-admin profile
databricks auth profiles
databricks auth describe --profile <account-profile>

# Prove account APIs work (do not require jq on auth describe)
databricks account workspaces list --profile <account-profile> -o json | jq 'length'

# 3. Install both skill libraries if missing
# ai-platform-kit (workspaces, catalogs, storage, networking)
bash <(curl -sL https://raw.githubusercontent.com/databricks-solutions/ai-platform-kit/main/install.sh) \
  --agent <harness> --scope global
# Examples: --agent cursor | --agent claude | --agent all

# databricks-agent-skills (pipelines, DABs, dashboards, agents)
databricks aitools install

# Confirm skills exist where THIS harness reads them
find ~/.claude/skills ~/.cursor/skills .claude/skills .cursor/skills \
  -name SKILL.md \( -path '*platform-provisioning*' -o -path '*unity-catalog-setup*' \) 2>/dev/null

# 4. Cloud CLI for the target cloud
aws sts get-caller-identity --profile <aws-profile>   # AWS
az account show                                        # Azure: note tenant + subscription
gcloud auth list                                       # GCP
terraform version                                      # >= 1.9.0, all clouds
```

Run all four checks, then report the result as a table, not prose.
For every failure give the install command and where the value comes from.

## Verify

```bash
databricks auth profiles
```

Expected: the account-admin profile row shows `Valid` = `YES` and the account host for that cloud.

```bash
databricks account workspaces list --profile <account-profile> -o json | jq 'length'
```

Expected: a number (zero or more). An auth error means the account profile is wrong.

Do not run `databricks clusters list` against an account-host profile.
That check belongs after a workspace profile exists.

```bash
find ~/.claude/skills ~/.cursor/skills .claude/skills .cursor/skills \
  -name SKILL.md -path '*platform-provisioning*' 2>/dev/null
find ~/.claude/skills ~/.cursor/skills .claude/skills .cursor/skills \
  -name SKILL.md \( -path '*databricks-pipelines*' -o -path '*pipelines*' \) 2>/dev/null
```

Expected: each prints at least one path.
A skill is installed when its `SKILL.md` exists.
Frontmatter `name` may be `databricks-platform-provisioning` while the directory is `platform-provisioning`. Both forms are correct.

Example report format:

```text
CLI          v0.297.1        OK
Auth         profile Valid   OK
ai-platform-kit             not found   rerun install.sh --agent <harness> --scope global
databricks-agent-skills     OK
Terraform    v1.9.8          OK
AWS profile  not set         ask the user which named profile to use
```

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `databricks: command not found` | CLI not installed | Install per the Databricks CLI docs |
| Account profile `Valid=NO` or account list fails | Wrong profile or missing account admin | Fix login / SP secret; confirm Account admin role |
| `auth describe` prints "Unable to load OAuth Config" but account APIs work | Describe quirk on some M2M profiles | Trust `auth profiles` + `account workspaces list`, not describe alone |
| `databricks: unknown command "aitools"` | CLI below v1.0.0 | Upgrade the CLI, then rerun `databricks aitools install` |
| Skill find returns empty on Cursor | Searched only `~/.claude` | Search `~/.cursor/skills/` or reinstall with `--agent cursor --scope global` |
| Skills installed but the agent never invokes them | Project-scope install, agent started from a different directory | Reinstall ai-platform-kit with `--scope global`, or start the agent from the install directory |
| `terraform version` below 1.9.0 | Old Terraform | Install Terraform >= 1.9.0 |
| Cloud CLI not authenticated | No profile or login | `aws configure` / `az login` / `gcloud auth login` |

## Next

- **Do next:** [Workspaces](/docs/01-infra-setup/workspaces/)
- **Reference:** [ai-platform-kit](https://github.com/databricks-solutions/ai-platform-kit), [databricks-agent-skills installation](https://github.com/databricks/databricks-agent-skills#installation), [Databricks CLI authentication](https://docs.databricks.com/aws/en/dev-tools/cli/authentication)
