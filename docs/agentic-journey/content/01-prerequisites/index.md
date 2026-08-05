---
sidebar_position: 0
sidebar_label: 1. Prerequisites
description: Verify the Databricks CLI, ai-platform-kit, and databricks-agent-skills before executing any journey section.
---

# 1. Prerequisites

**Goal:** confirm the three things every later section depends on. Run this before any other page.

Run all three checks, then report which passed and which failed with the fix for each. Do not start a section with a missing prerequisite: `databricks-platform-provisioning` will stop mid-Terraform, and the pipeline sections will produce bundle YAML you cannot deploy.

## The three checks

```bash
# 1. Databricks CLI installed and recent enough
databricks version

# 2. Authenticated against the target host
databricks auth describe

# 3. Both skill libraries visible to this harness
ls ~/.claude/skills/ 2>/dev/null | grep -E 'databricks-(core|dabs|pipelines)|platform-provisioning|unity-catalog-setup'
ls .claude/skills/ 2>/dev/null | grep -E 'platform-provisioning|unity-catalog-setup'
```

| Check | Pass | Fail |
|---|---|---|
| CLI | `databricks version` prints `v0.296.0` or later | [Install the CLI](/docs/01-prerequisites/databricks-cli) |
| Auth | `databricks auth describe` prints a host and a valid credential | [Authenticate](/docs/01-prerequisites/databricks-cli#authenticate) |
| Skills | Both libraries resolve | [Install the skill libraries](/docs/01-prerequisites/skill-libraries) |

:::warning
The skill directory differs per harness. Claude Code uses `~/.claude/skills/` (global) or `.claude/skills/` (project); Codex, Cursor, Copilot, and OpenCode each use their own. Check the directory your harness actually reads before reporting a library as missing. The listing commands above cover the Claude Code layout only.
:::

## Cloud CLI

Section 2 provisions cloud infrastructure with Terraform, so the cloud CLI for the target cloud has to be authenticated too. Check only the cloud the user is deploying to.

```bash
aws sts get-caller-identity           # AWS
az account show                       # Azure
gcloud auth list                      # GCP
terraform version                     # >= 1.9.0, all clouds
```

Sections 3 and 6 to 13 do not need the cloud CLI or Terraform. They go through the Databricks CLI.

## What to report

Report the result as a table, not prose. For every failure give the install command and where the value comes from. Example:

```text
CLI          v0.297.1        OK
Auth         missing         run: databricks auth login --host <workspace-url>
ai-platform-kit             not found   run the installer (see Prerequisites > Skill libraries)
databricks-agent-skills     OK (12 skills)
Terraform    v1.9.8          OK
AWS profile  not set         ask the user which named profile to use
```

Then ask for the missing human-sourced values in one message.

## Next

- **Do next:** [Databricks CLI](/docs/01-prerequisites/databricks-cli)
- **Then:** [Skill libraries](/docs/01-prerequisites/skill-libraries)
- **Reference:** [Databricks CLI authentication](https://docs.databricks.com/aws/en/dev-tools/cli/authentication)
