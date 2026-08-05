# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## What this repo is

A Docusaurus 3 site at `docs/agentic-journey/` (not the repo root, so all `npm` commands run from there). See [README.md](README.md) for the layout and how it differs from [Starter Journey](https://databricks-solutions.github.io/starter-journey/), from which it was structurally cloned.

The audience is a coding agent, not a human. That is the constraint behind almost every content decision below.

## Writing rules for doc pages

Every page follows the same five-block contract, documented for readers in `docs/agentic-journey/docs/how-to-use.mdx`: **Goal**, **Skill**, **Inputs** (with a `Source` column saying human-provided vs agent-derived), **Run**, **Verify**.

- Verification is a runnable command plus its expected output. Never "confirm it looks right in the UI".
- Prefer a check that would catch a *silent* failure over one that only catches an error: row counts and freshness over exit status, a masked-principal query over `SHOW POLICIES`, a metric-view-vs-raw-SQL reconciliation over "the view exists".
- No screenshots, video embeds, click-by-click walkthroughs, or motivational framing. Short imperative sentences and command blocks.
- Where no agentic path exists, link the equivalent Starter Journey page and say plainly that the step is manual. Do not invent a skill.
- No em dashes or en dashes anywhere (per the user's global instruction). One sentence per line in Markdown.

## Never cite an unverified skill

Both skill libraries are referenced by name and URL only, never vendored. Before citing a skill, confirm it exists upstream and read its `SKILL.md` frontmatter so the prose matches what it actually does:

```bash
gh api "repos/databricks/databricks-agent-skills/git/trees/HEAD?recursive=1" \
  --jq '.tree[] | select(.path | test("plugins/databricks/claude/skills/[^/]+/SKILL.md$")) | .path'
gh api "repos/databricks-solutions/ai-platform-kit/git/trees/HEAD?recursive=1" \
  --jq '.tree[] | select(.path | test("^.claude/skills/[^/]+/SKILL.md$")) | .path'
```

ai-platform-kit skills are cited by their frontmatter `name` (`databricks-platform-provisioning`), which differs from the directory name (`platform-provisioning`). Both forms appear in the docs and both are legitimate.

## Sharp edges

- **webpack is pinned to 5.105.3** via `overrides` in `package.json`. 5.109.x tightened `ProgressPlugin` option validation and Docusaurus 3.9.2 fails schema validation against it, with an error that looks like a config problem rather than a version conflict. `package-lock.json` is committed to keep the set pinned. Do not remove the override without re-running `npm run build`.
- **MDX parses `<word>` as a JSX tag.** A placeholder like `<principal>` is safe inside a normal code span, but escaped backticks (``\`<x>\```) break out of the span and fail compilation. Use double-backtick delimiters for a code span that must itself contain backticks.
- **`onBrokenLinks: 'throw'` is deliberate** and is the link check. A green `npm run build` means no broken internal links. Never relax it to get a passing build.
- **Two `type: 'doc'` navbar items both activate on every docs page**, because doc-type activation is per-plugin. The navbar uses plain `to:` links so activation is per-path.
- **`.markdown table` uses `overflow-x: auto`, not `hidden`.** Hidden clips the rounded corners as intended but also clips wide tables unreachably on narrow viewports, and nearly every page here has a wide input or failure-mode table.

## Verification before calling doc work done

From `docs/agentic-journey/`:

```bash
npm run build       # link check; must pass with onBrokenLinks: 'throw' intact
npm run typecheck
```

Then check: every `sidebars.ts` entry resolves to a real doc and every doc is reachable from the sidebar; no `starter-journey` strings outside intentional external fallback links; no references to assets not in `static/img/` (only the logo and favicons are kept); every cited skill name resolves upstream.

## Decisions carried from the initial build

- **`StarterJourneyProgress` and its CSS tokens were dropped**, not ported. A visual progress ladder is human scaffolding; it carries no information an agent can act on. The fork-track sidebar CSS that styled it went with it.
- **No content images.** Only `databricks-logo.png` (used by `HeaderAnimation`), `databricks.ico`, and `databricks-logo-orange.png` (favicon) are kept. No architecture diagram earned its place: prose plus a code block said it better for a machine reader.
- **Analytics were dropped entirely**, not re-pointed. Starter Journey's gtag block and `gtag-shim` client module carry its tracking ID.
- **Genie Agents live in section 8, not section 10.** They read the metric views built there. Section 10 covers document and retrieval surfaces.
- **Section 10 (Agents) scope is a judgement call**, since the source plan did not specify it. Flagged as such on the section index page itself.
- **Per-cloud workspace pages were kept** because the auth inputs genuinely differ (AWS needs an account-admin SP with an OAuth secret, Azure uses `azure-cli` auth with `azure_tenant_id` on every provider block, GCP needs SA impersonation with `auth_type = "google-id"`). The manual/terraform/SRA triple collapsed to the agentic path plus a Starter Journey pointer.
- **Metric views ship as a SQL task in a bundle job**, since they are not a DABs resource type, while dashboards and Genie Agents are native resources. Verified against `databricks/bundle-examples` `knowledge_base/`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
