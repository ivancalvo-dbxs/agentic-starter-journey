---
sidebar_position: 0
sidebar_label: 4. Data governance strategy
description: Present the two catalog layout proposals, get a decision from the user, then create the catalogs.
---

# 4. Data governance strategy

**Goal:** the user picks a catalog and schema layout, on the record, before any catalog exists.

**Prerequisites:** [2. Infra setup](/docs/02-infra-setup/) complete. Account-level groups exist and the metastore is group-owned.

This page is a decision, not a task.
Present both proposals, ask which one fits, then go to [Create catalogs](/docs/04-data-governance-strategy/create-catalogs) with the answer.

Do not pick for the user.
The layout determines every table name in the account, and changing it after a few hundred tables exist means rewriting every query that references them, so in practice it never gets changed.

## Ask this first

One question decides it:

> Does more than one business unit share this Databricks deployment, and must teams from different units be prevented from seeing each other's development data by default?

**No** to either half, propose A.
**Yes** to both, propose B.

Also worth asking, because it changes the catalog count rather than the shape:

| Question | Effect |
|---|---|
| How many environments? | Dev / staging / prod is the default. A POC can start with one. |
| A sandbox catalog for ad-hoc work? | Recommended. Keeps demos and exploration out of project schemas. |
| Which group owns each project? | Becomes the schema owner. Needs to be an account-level group from [Create groups](/docs/02-infra-setup/create-groups). |

## Proposal A: small organizations

One catalog per environment. No prefixes.

```text
dev            stg            prod           sandbox
└─ <project>_bronze           (same layout in each catalog)
└─ <project>_silver
└─ <project>_gold
```

| Element | Rule |
|---|---|
| Catalogs | One per environment, each bound to its workspace. Production is `ISOLATED` and bound to the production workspace only. |
| Schemas | Medallion per project: `<project>_bronze`, `<project>_silver`, `<project>_gold` |
| Ownership | The group that builds a project owns its three schemas |
| Grants | At the schema level, to groups. Never per table, never per user. |
| Writes to production | Automation only, running as a service principal. No interactive writes. |

Fits one or two data teams sharing the same data boundaries.

## Proposal B: medium to large organizations

Proposal A with a business-unit prefix stamped on catalogs, workspaces, and groups.

```text
dev_finance    stg_finance    prod_finance
dev_marketing  stg_marketing  prod_marketing
└─ <project>_bronze / _silver / _gold
```

| Element | Rule |
|---|---|
| Catalogs | `<env>_<bu>`, one set per business unit per environment |
| Workspaces | `<bu>-development`, `<bu>-staging`, `<bu>-production` |
| Groups | `<bu>_data_engineers`, `<bu>_data_analysts`, and so on |
| Schemas | Unchanged from A: medallion per project inside each prefixed catalog |
| Cross-unit access | Explicit schema-level grant from the owning unit's group to the requesting unit's group |

The prefix is the whole mechanism.
It makes a wrong grant visible in review, because the names stop matching.

## What the layouts share

Both are the same model.
B just adds a naming layer.

- Catalog per environment, workspace-bound.
- Medallion schemas per project.
- Group-based grants at the schema level.
- Least privilege: read-only for analysts, read-write for the owning engineers, view-only for business users.

If the user is unsure, propose A and say once that adding prefixes later is a rename, while un-prefixing an over-engineered layout is a migration.
A five-person team does not need business-unit prefixes.

## Non-negotiables the skill enforces

`databricks-unity-catalog-setup` refuses these regardless of the proposal chosen. Do not try to talk around them:

- **One dedicated storage account or bucket per catalog.** Sharing storage across catalogs breaks blast-radius isolation and allows cross-environment data leakage.
- **No DBFS for production data.** External locations with Unity Catalog storage credentials instead.
- **No workspace-local groups as grant principals.** Unity Catalog cannot see them.
- **One metastore per region**, shared across the workspaces in it.

It also warns once, then proceeds, if the user wants the Databricks-managed (vending machine) metastore for production.
That default storage is serverless-only, so classic compute cannot read it.

## Next

- **Do next:** [Create catalogs](/docs/04-data-governance-strategy/create-catalogs)
- **Background:** [Modeling a medallion architecture on Unity Catalog](https://blog.databricksforstartups.com/part-1-modeling-a-medallion-architecture-on-unity-catalog-for-your-organizational-structure-b8f0f9918c26)
- **Reference:** [Unity Catalog best practices](https://docs.databricks.com/aws/en/data-governance/unity-catalog/best-practices.html)
