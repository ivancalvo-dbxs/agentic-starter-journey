---
sidebar_label: Skill libraries
description: Install ai-platform-kit and databricks-agent-skills, and verify the harness can resolve every skill this journey cites.
---

# Skill libraries

**Goal:** both skill libraries installed where this harness reads skills from, with every skill name below resolving.

## ai-platform-kit

Ships 6 skills that provision the platform. Installed by a stdlib-only Python script that writes the skills into the layout your agent expects.

```bash
bash <(curl -sL https://raw.githubusercontent.com/databricks-solutions/ai-platform-kit/main/install.sh)
```

Non-interactive, global, for a specific agent:

```bash
bash <(curl -sL https://raw.githubusercontent.com/databricks-solutions/ai-platform-kit/main/install.sh) \
  --agent claude --scope global
```

`--agent` accepts `claude`, `codex`, `cursor`, `copilot`, `gemini`, `windsurf`, `opencode`, `kiro`, or `all`. Project scope is the default and requires running the agent from that directory; global scope works from anywhere.

| Skill | Frontmatter name | Journey use |
|---|---|---|
| `platform-provisioning` | `databricks-platform-provisioning` | [2. Create workspaces](/docs/02-infra-setup/create-workspaces/) |
| `identity-governance` | `databricks-identity-governance` | [2. Create groups](/docs/02-infra-setup/create-groups) |
| `unity-catalog-setup` | `databricks-unity-catalog-setup` | [2. Metastore owner](/docs/02-infra-setup/metastore-owner), [4. Create catalogs](/docs/04-data-governance-strategy/create-catalogs), [5. Access your data](/docs/05-access-your-data) |
| `workspace-config` | `databricks-workspace-config` | SQL warehouses, cluster policies, secret scopes, IP access lists |
| `deployment-verification` | `databricks-deployment-verification` | Mandatory after every section 2 deploy |
| `private-networking` | `databricks-private-networking` | Private Link, NCC, PSC. Only when the user asks for it. |

Repo: [databricks-solutions/ai-platform-kit](https://github.com/databricks-solutions/ai-platform-kit)

## databricks-agent-skills

Ships 30 skills that build on the platform. Two install paths.

```bash
# Canonical. Auto-detects your agent(s) and writes to the right directory.
databricks aitools install
```

```text
# Claude Code plugin marketplace (stable skills only)
/plugin marketplace add databricks/databricks-agent-skills
/plugin install databricks@databricks-agent-skills
```

Codex, Cursor, and Copilot have their own marketplace commands; see the [upstream README](https://github.com/databricks/databricks-agent-skills#installation). The CLI path is the only one that exposes experimental skills.

Skills this journey cites, all under `plugins/databricks/claude/skills/<name>/SKILL.md` upstream:

| Skill | Journey use |
|---|---|
| `databricks-core` | Parent skill. Load first for any CLI, auth, profile, or bundle task. |
| `databricks-dabs` | Bundle structure and targets. Every section from 6 on. |
| `databricks-pipelines` | [6. Pipeline resource](/docs/06-build-first-pipeline/pipeline-resource) |
| `databricks-dbsql` | [7. Query and explore](/docs/07-query-and-explore) |
| `databricks-data-discovery` | [7. Query and explore](/docs/07-query-and-explore) |
| `databricks-unity-catalog` | [12. Data access control](/docs/12-data-access-control) |
| `databricks-metric-views` | [8. Metric views](/docs/08-unified-analytics/metric-views) |
| `databricks-aibi-dashboards` | [8. Dashboards](/docs/08-unified-analytics/dashboards) |
| `databricks-genie-agents` | [8. Genie Agents](/docs/08-unified-analytics/genie-agents) |
| `databricks-jobs` | [11. Orchestration](/docs/11-orchestration) |
| `databricks-ml-training` | [9. Feature tables](/docs/09-predictive-analytics/feature-tables), [9. Train and register](/docs/09-predictive-analytics/train-and-register) |
| `databricks-model-serving` | [9. Serving and batch](/docs/09-predictive-analytics/serving-and-batch) |
| `databricks-mlflow-evaluation` | [10. Evaluation](/docs/10-agents/evaluation) |
| `databricks-vector-search` | [10. Vector search](/docs/10-agents/vector-search) |
| `databricks-agent-bricks` | [10. Agent Bricks](/docs/10-agents/agent-bricks) |
| `databricks-lakeflow-connect` | [5. Access your data](/docs/05-access-your-data), SaaS and database ingestion |
| `databricks-execution-compute` | Running code on serverless or classic compute |

Repo: [databricks/databricks-agent-skills](https://github.com/databricks/databricks-agent-skills)

## Verify

```bash
# Claude Code, global scope
ls ~/.claude/skills/

# Claude Code, project scope
ls .claude/skills/

# Plugin marketplace cache
ls ~/.claude/plugins/cache/databricks-agent-skills/ 2>/dev/null
```

Expect the 6 ai-platform-kit directories and the databricks-agent-skills set to appear in at least one location. A skill is installed when its `SKILL.md` exists:

```bash
find ~/.claude .claude -name SKILL.md -path '*platform-provisioning*' 2>/dev/null
find ~/.claude .claude -name SKILL.md -path '*databricks-pipelines*' 2>/dev/null
```

Both should print a path.

:::warning
Do not paraphrase a skill from this site. Read the installed `SKILL.md` before invoking it: pushback level, mandatory steps, and required inputs live there, and they change between versions. This site tells you which skill to reach for, not what it does.
:::

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `databricks: unknown command "aitools"` | CLI below v1.0.0 | Upgrade the CLI, or use the plugin marketplace path |
| Skills installed but the agent never invokes them | Project-scope install, agent started from a different directory | Reinstall with `--scope global`, or start the agent from the install directory |
| A skill name here resolves to nothing | Skill is experimental or renamed upstream | Check the [upstream tree](https://github.com/databricks/databricks-agent-skills/tree/main/plugins/databricks/claude/skills). Report the gap rather than substituting a different skill. |

## Next

- **Do next:** [2. Infra setup](/docs/02-infra-setup/)
- **Reference:** [databricks-agent-skills installation](https://github.com/databricks/databricks-agent-skills#installation)
