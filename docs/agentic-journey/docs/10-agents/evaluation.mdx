---
sidebar_label: Evaluation
description: Score the agent with MLflow GenAI evaluation, build an eval dataset from traces, and monitor production.
---

# Evaluation

**Goal:** a scored evaluation set that says whether a change to the agent made it better, plus trace monitoring in production.

**Skill:** `databricks-mlflow-evaluation` (databricks-agent-skills).

**Prerequisites:** an agent from [Agent Bricks](/docs/10-agents/agent-bricks) or [8. Genie Agents](/docs/08-unified-analytics/genie-agents).

Without this page the agent cannot be improved, only adjusted.
Every prompt or scope change becomes a guess whose effect nobody measured, and "it seems better" is how an agent quietly regresses.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| What a good answer looks like | Human | Concretely, per question type. This becomes the guidelines a judge scores against. |
| What is unacceptable | Human | Answers that are wrong, out of scope, or unsafe. Drives the safety and scope scorers. |
| Question set | Human, plus traces | 20 to 50 real questions to start. Production traces grow it. |
| Expected answers | Human | For the questions where a correct answer exists. Not every question needs one. |
| Domain expert | Human | Who can judge borderline answers. Needed for judge alignment. |
| Experiment path | You derive | The MLflow experiment holding the eval runs |

Push for specifics on the quality bar.
"Accurate and helpful" cannot be scored.
"Cites the policy document it drew from, and says it does not know rather than guessing when the answer is not in the documents" can.

## Run

### 1. Build the eval dataset

Start from real questions.
Once the agent is serving, build the dataset from production traces instead of inventing questions: traces are the questions users actually ask, including the ones nobody predicted.

The skill covers trace ingestion and turning traces into an eval dataset.

### 2. Pick scorers

Built-in scorers first.
Write a custom `@scorer` only for something the built-ins do not cover.

| Scorer | Checks |
|---|---|
| `Guidelines` | The answer follows stated rules, given in natural language |
| `Correctness` | The answer matches the expected answer |
| `Safety` | The answer is not harmful |
| `RetrievalGroundedness` | The answer is supported by the retrieved context rather than invented |

`RetrievalGroundedness` is the one that catches the failure people most care about in a RAG agent: a fluent answer that the source documents do not support.

### 3. Run the evaluation

`mlflow.genai.evaluate()` runs the set and records per-question scores in the experiment.

Run it as a Databricks job, not locally, for the same reason training runs as a job: it needs workspace access and should outlive your session.

```yaml
# resources/<project>_agent_eval.job.yml
resources:
  jobs:
    <project>_agent_eval:
      name: ${bundle.name}-agent-eval
      parameters:
        - name: catalog
          default: ${var.catalog}
        - name: schema
          default: ${var.schema_prefix}_gold
      tasks:
        - task_key: evaluate
          notebook_task:
            notebook_path: ../src/agents/evaluate.py
```

### 4. Align the judges

An LLM judge that disagrees with the domain expert is measuring the wrong thing, and optimizing against it makes the agent worse while the scores go up.

The skill covers `MemAlign`, which aligns judges using expert feedback on specific answers.
Do this before trusting the scores to gate a change.

### 5. Production monitoring

Set up trace ingestion so production behaviour is visible, not just the eval set.
An agent that scores well on 40 curated questions and badly on the long tail is only detectable from traces.

## Verify

```bash
# Eval runs exist with scores
databricks api post /api/2.0/mlflow/runs/search --profile <name> --json '{
  "experiment_ids": ["<experiment-id>"],
  "order_by": ["attributes.start_time DESC"],
  "max_results": 5
}' | jq -r '.runs[] | "\(.info.run_id)\t\(.info.status)\t\([.data.metrics[]? | "\(.key)=\(.value)"] | join(" "))"'
```

Expect a run per evaluation with a metric per scorer.

Then confirm the run actually scored every question rather than erroring on most of them:

```bash
databricks api post /api/2.0/mlflow/runs/get --profile <name> \
  --json '{"run_id": "<run-id>"}' \
  | jq -r '.run.data.metrics[] | "\(.key)\t\(.value)"'
```

A scorer at exactly 1.0 or exactly 0.0 across the whole set usually means it did not run, not that the agent is perfect or broken.
Check a few individual traces before reporting the number.

The real check is a comparison.
Run the eval, change one thing, run it again, and report both numbers:

```bash
databricks api post /api/2.0/mlflow/runs/search --profile <name> --json '{
  "experiment_ids": ["<experiment-id>"],
  "order_by": ["attributes.start_time DESC"],
  "max_results": 2
}' | jq -r '.runs[] | "\(.info.start_time)\t\([.data.metrics[]? | "\(.key)=\(.value)"] | join(" "))"'
```

A change with no measured improvement is not an improvement.
Say so.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Every question scores identically | Scorer did not run, or the guidelines are unscoreable | Inspect individual traces; make the guidelines concrete |
| Scores improve, users complain | Judge is not aligned with the domain expert | Align with `MemAlign` using expert feedback |
| `RetrievalGroundedness` low with good answers | Retrieved context is not being passed to the scorer | Check the trace captures the retrieval step |
| Eval set passes, production is worse | Eval set is not representative | Rebuild it from production traces |
| Eval run dies partway | Ran locally, session dropped | Run it as a job |
| No traces to build a dataset from | Trace ingestion not configured | Set it up before the agent has real traffic worth learning from |

## Next

- **Do next:** [11. Orchestration](/docs/11-orchestration)
- **Reference:** [MLflow GenAI evaluation](https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/)
