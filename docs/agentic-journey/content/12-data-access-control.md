---
sidebar_position: 0
sidebar_label: 12. Data access control
description: Protect sensitive columns at schema scale with tag-driven ABAC policies in Unity Catalog.
---

# 12. Data access control

**Goal:** sensitive columns masked by policy for everyone except the groups that need them, applied at schema scale rather than per table.

**Skill:** `databricks-unity-catalog` (databricks-agent-skills). It covers the privilege model, row-level security, and column masks.

**Prerequisites:** [4. Create catalogs](/docs/04-data-governance-strategy/create-catalogs) complete, with account-level groups holding grants.

Use ABAC, not per-table masks.
Define the policy once, bind it to a tag, and every column carrying that tag inherits the mask, including columns on tables that do not exist yet.
Per-table wiring fails the first time someone adds a table and forgets the mask.

:::warning
ABAC security policies need DBR 16.4 or later, or serverless compute.
On an older runtime the policy evaluation fails with a permission error rather than silently passing, but check the compute before writing the policy.
:::

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| Columns to protect | Human | Which columns, in which schemas. Ask what is actually sensitive rather than assuming from column names. |
| Who sees real values | Human | Per column. Must be account-level groups. |
| Redact or hash | Human | Redaction returns NULL or a placeholder. Hashing keeps joinability. See below. |
| Tag key and values | Human | For example `sensitivity` with values `high`, `pii`. Must be a governed tag, not a custom one. |
| Row filtering needed? | Human | Whether different groups should see different rows, not just different columns |
| Compliance framework | Human | HIPAA, PCI-DSS, GDPR. Changes which columns are in scope and may imply row filters too. |

## The three building blocks

```sql
-- 1. Tag the column so a policy can find it
ALTER TABLE <catalog>.<schema>.employees
  ALTER COLUMN salary SET TAGS ('sensitivity' = 'high');

-- 2. A UDF that returns the substitute value
CREATE OR REPLACE FUNCTION <catalog>.security.mask_salary(salary DOUBLE)
RETURNS DOUBLE
RETURN NULL;

-- 3. A policy binding the UDF to any column carrying the tag
CREATE OR REPLACE POLICY salary_policy
ON SCHEMA <catalog>.<schema>
COLUMN MASK <catalog>.security.mask_salary
TO `account users` EXCEPT hr_admin, finance
FOR TABLES
MATCH COLUMNS has_tag_value('sensitivity', 'high') AS salary
ON COLUMN salary;
```

Who sees the real value is decided by the policy's `TO ... EXCEPT` clause, not by the function.
The function only produces the substitute.

## Use a governed tag, not a custom one

This is the part that decides whether the policy is enforceable.

| Tag type | Who sets it | Safe as a policy trigger | Use for |
|---|---|---|---|
| **Custom** | Anyone with `ALTER` | No | Discovery, search, team labels |
| **Governed** | Only authorized users, values policy-controlled | Yes | Compliance classification, ABAC triggers |
| **System** | Databricks, automatically | Yes | Automatic PII classification output |

A custom tag can technically appear in a policy binding, and that is a trap: anyone with `ALTER` on the schema can remove it and silently drop the mask.

```sql
-- With a custom tag, any data engineer with ALTER can do this. The mask is gone.
ALTER SCHEMA <catalog>.<schema> UNSET TAGS ('sensitivity');
```

Governed tags also enforce consistent values, so every team writes `sensitivity = 'pii'` rather than `pii`, `PII`, and `Personally Identifiable` across three schemas with one policy matching one of them.

Creating a tag policy is console work: Catalog Explorer, select the catalog, **Tags** tab, define the key and allowed values, assign which groups can apply it.
No skill covers that step.
Say so, do it once, then everything below is CLI.

## Automatic classification

Unity Catalog can scan tables and apply PII tags without manual tagging.
Enable it in Catalog Explorer under **Data Classification**, and columns receive a `databricks:columnPiiTypes` tag with values like `EMAIL_ADDRESS`, `PHONE_NUMBER`, `US_SOCIAL_SECURITY_NUMBER`, `CREDIT_CARD_NUMBER`, `PERSON_NAME`.

A policy that matches those system tags covers new tables the moment they are scanned, with no tagging step at all.
That is the most scalable configuration, and worth proposing when the user has more tables than they can tag by hand.
System tags are read-only.

## Redact or hash

| Strategy | Returns | Use when |
|---|---|---|
| Redaction | `NULL`, or a fixed placeholder like `'XXX-XX-XXXX'` | Analysts have no reason to correlate on the value: salary, diagnosis |
| Hashing | `SHA2(value, 256)` | Cross-dataset joins matter. Deterministic, so the same input always gives the same token. |

Hashing lets a data scientist join `events` to `customers` on the token without seeing an email address.
Ask which one they need per column, because getting this wrong either breaks a join or leaks correlatable data.

## Row filters

Same mechanics, different target.
A column mask controls what a visible row shows; a row filter controls which rows are visible.

Use `ROW FILTER` with a `BOOLEAN`-returning function, and `USING COLUMNS` instead of `ON COLUMN`.

```sql
CREATE OR REPLACE FUNCTION <catalog>.security.filter_region(region STRING)
RETURNS BOOLEAN
RETURN is_account_group_member('region_emea') AND region = 'EMEA';

CREATE OR REPLACE POLICY region_policy
ON SCHEMA <catalog>.<schema>
ROW FILTER <catalog>.security.filter_region
TO `account users` EXCEPT hr_admin
FOR TABLES
MATCH COLUMNS has_tag_value('sensitivity', 'region') AS region
USING COLUMNS (region);
```

Reach for a row filter when different groups should see different slices: a regional manager sees their region, a support rep sees their queue.

## Verify

Metadata checks first:

```bash
# The policy exists on the schema
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SHOW POLICIES ON SCHEMA <catalog>.<schema>",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[] | @tsv'

# The tag is applied where you expect
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT table_name, column_name, tag_name, tag_value FROM <catalog>.information_schema.column_tags WHERE schema_name = \"<schema>\"",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[] | @tsv'
```

Then the check that actually proves the mask works, which metadata cannot: query as a principal that should be masked.

```bash
# As an unprivileged principal (a test SP not in the EXCEPT list)
databricks api post /api/2.0/sql/statements --profile <test-sp-profile> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT salary FROM <catalog>.<schema>.employees LIMIT 5",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array'
```

Expect the masked value.
If real salaries come back, the policy is not applying, and the most common reasons are a runtime below DBR 16.4 or the principal being in the `EXCEPT` list without anyone realising.

Then confirm the privileged path still works, since a mask that blocks everyone is also a failure:

```bash
databricks api post /api/2.0/sql/statements --profile <privileged-profile> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT salary FROM <catalog>.<schema>.employees LIMIT 5",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array'
```

Finally, prove it covers new tables, which is the entire reason for using ABAC:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "CREATE TABLE <catalog>.<schema>._abac_test (id INT, salary DOUBLE); ALTER TABLE <catalog>.<schema>._abac_test ALTER COLUMN salary SET TAGS (\"sensitivity\" = \"high\"); INSERT INTO <catalog>.<schema>._abac_test VALUES (1, 100000)",
  "wait_timeout": "50s"
}' | jq -r '.status.state'
```

Query it as the unprivileged principal.
The new table's `salary` must already be masked with no policy change.
Drop the test table afterwards.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Policy created, values not masked | Compute below DBR 16.4 and not serverless | Use serverless or a 16.4+ runtime |
| Mask disappears after a schema change | Custom tag, removed by someone with `ALTER` | Use a governed tag |
| Policy matches nothing | Tag value case mismatch, `'PII'` against `'pii'` | Governed tags prevent this. Check `column_tags` for the actual values. |
| Privileged group also masked | Group name wrong in `EXCEPT`, or it is workspace-local | Compare against `databricks account groups list` exactly |
| Joins break after masking | Redaction used where hashing was needed | Switch that column to `SHA2(value, 256)` |
| New tables unprotected | Columns not tagged | Enable automatic classification, or make tagging part of the pipeline |
| `databricks:` tag cannot be set | System tags are read-only | Do not set them. They update when classification reruns. |

## Next

- **Do next:** [13. CI/CD and DevOps](/docs/13-ci-cd-devops/)
- **Manual fallback:** [Starter Journey: Data access control](https://databricks-solutions.github.io/starter-journey/docs/13-data-access-control/)
- **Reference:** [ABAC in Unity Catalog](https://docs.databricks.com/aws/en/data-governance/unity-catalog/abac/), [automatic data classification](https://docs.databricks.com/aws/en/data-governance/unity-catalog/data-classification.html)
