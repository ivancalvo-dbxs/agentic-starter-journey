---
sidebar_label: Create groups
description: Create account-level SCIM groups and a deployment service principal with databricks-identity-governance.
---

# Create groups

**Goal:** account-level SCIM groups mapped to data personas, plus a service principal for automated jobs.

**Skill:** `databricks-identity-governance` (ai-platform-kit).

**Prerequisites:** [Create workspaces](/docs/02-infra-setup/create-workspaces/) complete, and an account-level profile authenticated.

## Hard rules the skill enforces

These are not preferences. Violating them causes silent failures, so do not argue the user out of them.

1. **Account-level SCIM groups only.** Workspace-local groups are invisible to Unity Catalog. Every grant in sections 4, 5, and 12 needs account-level groups.
2. **Grant to groups, never to individual users.** User-level grants are unauditable at scale.
3. **Service principals for all automated jobs.** User tokens expire and people leave, so user-run jobs break silently. Section 13 CI/CD needs an SP.
4. **Least privilege on workspace roles.** Only the platform team gets `ADMIN`. Everyone else gets `USER`, and data access comes from Unity Catalog grants.
5. **List existing groups before creating.** Account-level groups outlive workspaces, so a fresh deploy into an old account will hit SCIM conflict errors otherwise.
6. **When a service principal creates Unity Catalog objects, human admins do not inherit access.** Workspace admin and Unity Catalog privileges are separate planes. Every deploy that runs as an SP must include explicit grants to the human admin group, or transfer ownership. Skip this and the user logs into a workspace where they cannot see their own catalog.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Group naming convention | Human | House convention if they have one. Otherwise propose the persona set below. |
| Business unit or project prefix | Human | Only if they want per-project groups, `<bu>-data-engineers`. Ask whether one flat set is enough for now. |
| Workspace IDs | You derive | `databricks account workspaces list` |
| Human admin group members | Human | The emails that must retain admin after an SP-driven deploy |
| Deployment SP name | You derive | `<prefix>-deployer` or similar |

## The default persona set

Propose this when the user has no convention. Rename freely, but keep the boundaries: the lines between groups are where access control happens.

| Group | Workspace role | Unity Catalog access |
|---|---|---|
| `platform-admins` | ADMIN on all workspaces | `ALL_PRIVILEGES` on catalogs. Owns the metastore. |
| `data-engineers` | USER | Full CRUD on project schemas in all environments |
| `data-analysts` | USER | SELECT on silver and gold, production and staging only |
| `data-scientists` | USER | Full CRUD in dev, read-only in staging, no production |
| `ml-ops` | USER | Read and write in dev, read in staging and production |

Also create one admin group per workspace (`dev-ws-admins`, `stg-ws-admins`, `prod-ws-admins`) so no single group holds every environment.

If the user proposes a single flat admin group, say once that tiered groups are better for least privilege, then do what they ask.

## Run

### 1. List what already exists

```bash
databricks account groups list --profile <name>-account -o json \
  | jq -r '.[] | .displayName' | sort
```

Report the existing groups before creating anything. Reuse rather than duplicate.

### 2. Invoke the skill

Hand it the persona set and the workspace IDs. It creates the groups through the Account SCIM API, assigns them to workspaces, and creates the deployment service principal.

### 3. SCIM provisioning from an identity provider

No skill covers the IdP side. If the user wants Okta or Entra ID pushing groups into Databricks, that configuration is manual: [Starter Journey: Add groups with SCIM](https://databricks-solutions.github.io/starter-journey/docs/03-infra-setup/add-groups/scim). Say so plainly rather than half-automating it.

Groups created directly through the Account SCIM API work for everything in this journey. IdP sync is about who maintains membership, not about whether the groups function.

## Verify

```bash
# Groups exist at the account level
databricks account groups list --profile <name>-account -o json \
  | jq -r '.[] | select(.displayName | test("platform-admins|data-engineers|data-analysts")) | "\(.displayName)\t\(.members | length // 0) members"'

# Groups are assigned to the workspace
databricks account workspace-assignment list --workspace-id <id> --profile <name>-account -o json \
  | jq -r '.permission_assignments[] | "\(.principal.display_name)\t\(.permissions | join(","))"'

# The deployment SP exists
databricks account service-principals list --profile <name>-account -o json \
  | jq -r '.[] | select(.displayName=="<prefix>-deployer") | .applicationId'
```

Expect each group to come back once, `platform-admins` holding `ADMIN` and every other group `USER`, and the SP's application ID printed.

The negative check matters as much: no workspace-local groups should exist.

```bash
databricks groups list --profile <name> -o json | jq -r '.[] | .displayName'
```

Anything here that is not also in the account list is workspace-local and invisible to Unity Catalog. Report it.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| SCIM conflict on create | Group already exists at the account level from a previous deploy | List first, reuse the existing group |
| Grants succeed but users see nothing | Groups created at workspace level | Recreate at account level; workspace-local groups cannot hold Unity Catalog privileges |
| Admins cannot see the catalog after deploy | SP created the objects and owns them | Grant the human admin group `ALL_PRIVILEGES` on the catalog and `MANAGE` on external locations and storage credentials, or transfer ownership |
| `invalid Databricks Account configuration` | Workspace profile used for an account command | Use the `-account` profile |

## Next

- **Do next:** [Metastore owner](/docs/02-infra-setup/metastore-owner)
- **Reference:** [Manage groups](https://docs.databricks.com/aws/en/admin/users-groups/groups)
