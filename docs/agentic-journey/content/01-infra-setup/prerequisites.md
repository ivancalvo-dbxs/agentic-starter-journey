---
description: Verify the Databricks CLI, the cloud CLI, and both skill libraries before running any other page.
---

# Pre-requisites

## Mental Model

Every later page assumes three things work: the Databricks CLI is installed and authenticated, the cloud CLI for the target cloud is authenticated, and both skill libraries are visible to the agent harness.
Skipping this page fails mid-flight: Terraform stops mid-apply, and bundle deploys reject unauthenticated calls.

## Goal

Confirm the three prerequisites every later page depends on, and report what passed and what failed with the fix for each.

## Prerequisites

None. This is the first page.

## Skill

None. This is a check page, not a skill invocation.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Target host | Human | The workspace URL, `https://<account>.cloud.databricks.com` |
| Target cloud | Human | `aws`, `azure`, or `gcp`. Drives which cloud CLI check to run. |
| Skill directory | You derive | Claude Code uses `~/.claude/skills/` or `.claude/skills/`. Codex, Cursor, Copilot, OpenCode each differ. Check the directory your harness reads. |

## Run

```bash
# 1. Databricks CLI installed and recent enough
databricks version

# 2. Authenticated against the target host
databricks auth describe

# 3. Both skill libraries visible to this harness
ls ~/.claude/skills/ 2>/dev/null | grep -E 'databricks-(core|dabs|pipelines)|platform-provisioning|unity-catalog-setup'
ls .claude/skills/ 2>/dev/null | grep -E 'platform-provisioning|unity-catalog-setup'

# 4. Cloud CLI for the target cloud
aws sts get-caller-identity           # AWS
az account show                       # Azure
gcloud auth list                      # GCP
terraform version                     # >= 1.9.0, all clouds
```

Run all four checks, then report the result as a table, not prose. For every failure give the install command and where the value comes from.

## Verify

```bash
databricks auth describe | jq -r '.host'
```

Expected text:

```text
https://<account>.cloud.databricks.com
```

```bash
databricks clusters list --profile <name> -o json | jq 'length'
```

Expected: a number (zero or more). An auth error means the profile is not configured.

Example report format:

```text
CLI          v0.297.1        OK
Auth         host printed    OK
ai-platform-kit             not found   run the installer
databricks-agent-skills     OK (12 skills)
Terraform    v1.9.8          OK
AWS profile  not set         ask the user which named profile to use
```

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `databricks: command not found` | CLI not installed | Install per the Databricks CLI docs |
| `auth describe` prints no host | No profile configured | `databricks auth login --host <workspace-url>` |
| Skill libraries not listed | Wrong skill directory for the harness | Check the harness docs, then re-list the correct directory |
| `terraform version` below 1.9.0 | Old Terraform | Install Terraform >= 1.9.0 |
| Cloud CLI not authenticated | No profile or login | `aws configure` / `az login` / `gcloud auth login` |

## Next

- **Do next:** [Workspaces](/docs/01-infra-setup/workspaces/)
- **Reference:** [Databricks CLI authentication](https://docs.databricks.com/aws/en/dev-tools/cli/authentication)
