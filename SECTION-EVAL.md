# Section eval cycle

How to prove a section (or a single page) is ready for peers: cold-start agents, feedback, rewrite, then destroy.

Use this file when the task is any of:

- Create or substantially rewrite a journey section or leaf page
- Test whether a page or feature works for a coding agent with no prior context
- Fan out agents across clouds, topologies, or targets
- Collect doc feedback, rewrite from that feedback, or destroy eval stacks

For day-to-day edits to existing prose or site wiring, start at [AGENTS.md](AGENTS.md) instead.

## Scope

Flexible by design. A run may cover a whole section (example: Infra Setup end-to-end) or one leaf (example: only Cloud Object Storage against an existing workspace and catalog).

Put existing assets and the exact goal in the agent brief.
Do not force a full rebuild when the human already has upstream resources.

## Cycle

1. **Serve the published site.** Agents start at `http://localhost:3000/agentic-starter-journey/` (or the deployed Pages URL). They follow the pages under test, not `content/` in git.
2. **Fan out cold-start agents.** Local Task agents with sealed briefs and no shared conversation context. Parallelize independent matrix cells (cloud × topology, or one page × N targets). Keep briefs short: entry URL, goal, credentials/profiles, human defaults, apply pre-approval if desired, feedback path.
3. **Primary deliverable is doc feedback.** Each agent writes a structured file (outcome, resources created, doc gaps as page → symptom → rewrite, failed Verify claims). Resource creation proves the page; rewriting the page is the point.
4. **Synthesize, then rewrite.** Parent ranks gaps, patches the section, runs `npm run build` and `npm run typecheck` from `docs/agentic-journey/`. Refresh the served `out/` if peers hit localhost.
5. **Leave stacks up for peer click-through** until the human says destroy. Destroy only on explicit ask. Prefer Terraform destroy from agent state dirs, then CLI cleanup of leftovers. Do not delete shared account resources (example: a pre-existing regional metastore) unless the brief says so.

## Feedback file shape

One file per agent. Suggested path: `~/superpowers/agentic-starter-journey/evals/<date>-<section>/<agent-id>.md` (home folder, not committed).

Required sections:

- Outcome: pass | partial | fail
- Resources created (URLs, IDs, names)
- Doc gaps: page → symptom → suggested rewrite
- Failed Verify claims vs what actually worked
- Skill or page mismatches

## Worked example

Infra Setup cold-start on AWS serverless + classic (2026-08-06).
Feedback drove naming gates, Verify fixes, serverless vs classic topology, and metastore-scoped catalogs.
Artifacts lived under `~/superpowers/agentic-starter-journey/evals/` and were not committed.
