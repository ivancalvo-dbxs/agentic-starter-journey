---
sidebar_label: Agent Bricks
description: Create a Knowledge Assistant for document Q&A, or a Supervisor Agent to route between agents.
---

# Agent Bricks

**Goal:** a Knowledge Assistant answering questions over the project's documents, or a Supervisor Agent routing between several agents.

**Skill:** `databricks-agent-bricks` (databricks-agent-skills). Supervisor Agent commands are Beta and need CLI v1.0.0 or later.

**Prerequisites:** documents in a Unity Catalog volume, or an index from [Vector search](/docs/10-agents/vector-search). For a Supervisor Agent, the agents it will route to must exist first.

| Brick | Use for |
|---|---|
| **Knowledge Assistant** | Document Q&A over PDFs or text in a volume |
| **Supervisor Agent** | Orchestrating several agents: Knowledge Assistants, serving endpoints, Unity Catalog functions, MCP servers |

## Knowledge Assistant

### Inputs

| Input | Source | How to obtain |
|---|---|---|
| Name and description | Human | What this assistant covers. The description shapes routing if a Supervisor Agent later uses it. |
| Document location | Human | A volume path, `/Volumes/<catalog>/<schema>/<volume>/`, or a vector search index |
| Which documents are authoritative | Human | When two documents disagree, which one wins. Goes in the description. |
| Test questions | Human | Real questions, used to verify before shipping |
| User groups | Human | Account-level groups |

### Run

```bash
# 1. Confirm the documents are where they should be
databricks volumes list <catalog> <schema> --profile <name> -o json | jq -r '.[] | .name'
databricks fs ls dbfs:/Volumes/<catalog>/<schema>/<volume>/ --profile <name>
```

Volume paths still need the `dbfs:` prefix with `databricks fs`.

```bash
# 2. Create the assistant
databricks knowledge-assistants create-knowledge-assistant \
  "<Name>" "<Description>" --profile <name>
```

```bash
# 3. Add a knowledge source
databricks knowledge-assistants create-knowledge-source \
  "knowledge-assistants/<ka_id>" --profile <name> \
  --json '{
    "display_name": "Docs",
    "description": "Project documentation",
    "source_type": "files",
    "files": {"path": "/Volumes/<catalog>/<schema>/<volume>/"}
  }'
```

With `--json`, pass only the parent as a positional argument.
Mixing positional `DISPLAY_NAME` / `DESCRIPTION` / `SOURCE_TYPE` with `--json` errors.

Source types are `files` for a volume path, or `index` for a vector search index (which takes `index.index_name`, `index.text_col`, and `index.doc_uri_col`).

```bash
# 4. Sync
databricks knowledge-assistants sync-knowledge-sources \
  "knowledge-assistants/<ka_id>" --profile <name>
```

Status moves `CREATING` (2 to 5 minutes) to `ONLINE`, then `OFFLINE` if it is stopped.

:::danger
`delete-knowledge-assistant` is destructive and irreversible.
Confirm the ID against `list-knowledge-assistants` before running it, and get explicit user confirmation.
:::

### Verify

```bash
# ONLINE, with the sources attached
databricks knowledge-assistants get-knowledge-assistant \
  "knowledge-assistants/<ka_id>" --profile <name> -o json \
  | jq '{name, status, sources: [.knowledge_sources[]?.display_name]}'
```

Expect `ONLINE` and the source listed.
`CREATING` means wait.

Then ask it the test questions:

```bash
databricks knowledge-assistants list-knowledge-assistants --profile <name> -o json \
  | jq -r '.[] | "\(.id)\t\(.name)\t\(.status)"'
```

Ask each test question through the assistant and read the answers.
An assistant that returns nothing for a question whose answer is clearly in the documents means the sync did not pick up those files, or the documents are scanned images with no extractable text.
Check the file list before blaming the model.

## Supervisor Agent

Use this when one agent is not enough: a Knowledge Assistant for policy documents plus a Genie Agent for the numbers, with the supervisor deciding which one answers.

### Inputs

| Input | Source | How to obtain |
|---|---|---|
| Agents to route between | You derive | Knowledge Assistants, serving endpoints, Unity Catalog functions, MCP servers. They must exist first. |
| Routing rules | Human | Which questions go where. Ambiguous cases matter most. |
| Description per child agent | Human | The supervisor routes on these, so a vague description produces bad routing |

Resource paths look like `supervisor-agents/<id>`.
Every command takes either that full path or a parent of that shape.

```bash
databricks supervisor-agents list-supervisor-agents --profile <name>
databricks supervisor-agents list-tools "supervisor-agents/<id>" --profile <name>
```

`list-supervisor-agents`, `list-examples`, and `list-tools` return bare JSON arrays rather than an object with a key, so pipe them as `.[]` not `.items[]`.

### Verify

```bash
databricks supervisor-agents list-supervisor-agents --profile <name> -o json \
  | jq -r '.[] | "\(.id)\t\(.name)"'

databricks supervisor-agents list-tools "supervisor-agents/<id>" --profile <name> -o json \
  | jq -r '.[] | .name'
```

Expect every child agent listed as a tool.
Then ask a question that should route to each child, and confirm it did.
A supervisor that sends every question to the same child has descriptions that do not distinguish them.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| `create-knowledge-source` errors on arguments | Positional args mixed with `--json` | Pass only the parent positionally, everything else in the JSON |
| Assistant `ONLINE` but answers nothing | Sync did not pick up the files, or they are scanned images | Check the file list, confirm the text is extractable |
| `databricks fs ls /Volumes/...` fails | Missing `dbfs:` prefix | `databricks fs ls dbfs:/Volumes/...` |
| Stuck at `CREATING` past 5 minutes | Large corpus, or unreadable files | Check the source status before recreating |
| Supervisor routes everything to one child | Child descriptions do not distinguish them | Rewrite the descriptions around the questions each one owns |
| Users get a permission error | Agent permission granted, no Unity Catalog grant on the volume or tables | Grant both |

## Next

- **Do next:** [Evaluation](/docs/10-agents/evaluation)
- **Reference:** [Agent Bricks](https://docs.databricks.com/aws/en/generative-ai/agent-bricks/)
