# Section eval cycle (Captain handbook)

How to prove a section (or a single page) is ready for peers: Captain supervises cold-start Crew, you verify outcomes, then feedback rewrites the site.

Use this file when the task is any of:

- Create or substantially rewrite a journey section or leaf page
- Test whether a page or feature works for a coding agent with no prior context
- Fan out agents across clouds, topologies, or targets
- Collect doc feedback, rewrite from that feedback, or destroy eval stacks
- Open a session with “Captain, the goal of this session is …”

For day-to-day edits to existing prose or site wiring, start at [AGENTS.md](AGENTS.md) instead.

Captain skill (load in the parent chat):

- Cursor: [`.cursor/skills/captain/SKILL.md`](.cursor/skills/captain/SKILL.md)
- Claude Code: [`.claude/skills/captain/SKILL.md`](.claude/skills/captain/SKILL.md)

## Roles

| Role | Who | Job |
|---|---|---|
| **You** | Human developer / content author | State the goal. Verify each Crew outcome (workspace config, pipeline + DABs, etc.). Pass/fail. Decide destroy at the end. |
| **Captain** | Parent agent in this chat | Mission plan → fan out Crew → pause for your verify → recover on fail → synthesize feedback → rewrite site. |
| **Crew** | Cold-start Task agents | No shared context. Follow the published site only. Apply without plan approval. Write feedback files. |

Session opener example:

> Captain, the goal of this session is to create an ETL pipeline from `s3://…` using tables A, B, C.

## Scope

Flexible by design. A run may cover a whole section (example: Infra Setup end-to-end) or one leaf (example: only Cloud Object Storage against an existing workspace and catalog).

Put existing assets and the exact goal in the Captain brief / Crew briefs.
Do not force a full rebuild when the human already has upstream resources.

## Cycle

1. **Serve the published site.** Crew starts at `http://localhost:3000/agentic-starter-journey/` (or the deployed Pages URL). They follow the pages under test, not `content/` in git.
2. **Captain states a mission plan**, then proceeds unless you interrupt. No terraform plan/apply approvals from you.
3. **Fan out Crew.** Parallelize independent matrix cells (cloud × topology, or one page × N targets). Briefs stay short: entry URL, goal, credentials/profiles, human defaults, auto-apply, feedback path.
4. **After each Crew, Captain checkpoints you.** You verify the real object (workspace, catalog, pipeline, DABs). Pass continues. Fail + why → Captain classifies (doc gap vs auth/perm vs bad brief) and re-briefs or rewrites.
5. **Primary deliverable is doc feedback.** Each Crew writes a structured file. Resource creation proves the page; rewriting the page is the point.
6. **Synthesize, then rewrite.** Captain ranks gaps, patches the section, runs `npm run build` and `npm run typecheck` from `docs/agentic-journey/`. Refresh the served `out/` if peers hit localhost.
7. **Leave stacks up** until you say destroy. Destroy only on explicit ask. Prefer Terraform destroy from Crew state dirs, then CLI cleanup of leftovers. Do not delete shared account resources (example: a pre-existing regional metastore) unless the brief says so.

Auto-apply is intentional: auth and permission blockers surface faster when Crew is not waiting on yes/no for every apply.

## Feedback file shape

One file per Crew agent. Suggested path: `~/superpowers/agentic-starter-journey/evals/<date>-<section>/<agent-id>.md` (home folder, not committed).

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
Later sessions should open as Captain sessions using this handbook and the Captain skill.
