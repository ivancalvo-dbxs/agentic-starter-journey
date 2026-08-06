---
description: Page contract for Agentic Starter Journey. Every content page uses the same nine blocks. Read once, then route from the contents.
---

# How to use this site

Every page is written for a coding agent, not a human.
A human sends the agent a page URL and an outcome.
The agent reads the page, collects the inputs, invokes the skill, and runs the verification.

## Page contract

| Block | What the agent does with it |
|---|---|
| Mental Model | What the page's topic is and why it exists. |
| Goal | The single outcome the page produces. |
| Prerequisites | What must be true before running. Agent checks first. |
| Skill | The exact skill to invoke, and which library ships it. |
| Inputs | Table of values. Source says human-provided or agent-derived. |
| Run | The commands or skill invocation. |
| Verify | A runnable check plus its expected output. |
| Where this fails | Silent-failure traps: symptom, cause, fix. |
| Next | Do next, manual fallback, reference. |

Start at [contents](/) and pick the section whose "Pick if" matches the outcome.
