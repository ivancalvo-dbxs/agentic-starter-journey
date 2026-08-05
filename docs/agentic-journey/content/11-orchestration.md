---
sidebar_position: 0
sidebar_label: 11. Orchestration
description: Chain the project's resources into Lakeflow Jobs defined in the bundle.
---

# 11. Orchestration

**Goal:** the project's pipeline, feature, scoring, and metric-view work chained into jobs defined in the bundle, running on a schedule or a trigger.

**Skill:** `databricks-jobs` (databricks-agent-skills). Invoke it before writing the job YAML. `databricks-dabs` for the resource shape.

**Prerequisites:** the resources to orchestrate exist, from sections 6, 8, and 9.

By now the project has several jobs that were created one at a time.
This section is where they stop being independent.
Two jobs on separate schedules that read each other's output will drift, and the failure is silent: the scoring job succeeds on yesterday's features and nobody sees an error.

## Inputs

| Input | Source | How to obtain |
|---|---|---|
| What must run in what order | You derive, confirm with human | The dependency graph. Features before scoring, pipeline before metric views. |
| Trigger type | Human | Schedule, file arrival, table update, or manual. See below. |
| Schedule and timezone | Human | If scheduled. Ask for the timezone explicitly; a cron in the wrong zone is a class of bug that surfaces at a quarter boundary. |
| Failure notifications | Human | Who to tell, and on what. Ask for a channel or email. |
| Retry policy | Human | Whether a transient failure should retry, and how many times |
| Run identity | You derive | Service principal for staging and production, never a user |
| SLA expectations | Human | When a late run becomes a problem. Drives timeout settings. |

## Trigger types

Pick from the data's behaviour, not from habit.

| Trigger | Use when |
|---|---|
| Schedule (cron) | Work must run at a fixed time, for example a daily 06:00 refresh |
| File arrival | Files land unpredictably and processing should start when they do |
| Table update | A downstream job should run when an upstream table changes |
| Continuous | A streaming pipeline that should always be running |
| Manual only | Definition-applying jobs like metric view registration, which run on deploy |

File arrival and table update triggers avoid the polling pattern of "schedule it every 15 minutes and hope".

## One job, several tasks

Prefer one job with dependent tasks over several jobs that trigger each other.
A single job gives one run history, one failure notification, and one place to see where the chain stopped.

```yaml
# resources/<project>_daily.job.yml
resources:
  jobs:
    <project>_daily:
      name: ${bundle.name}-daily
      parameters:
        - name: catalog
          default: ${var.catalog}
        - name: schema
          default: ${var.schema_prefix}_gold
      schedule:
        quartz_cron_expression: "0 0 6 * * ?"
        timezone_id: UTC
        pause_status: UNPAUSED
      email_notifications:
        on_failure:
          - <team-alias>
      tasks:
        - task_key: ingest
          pipeline_task:
            pipeline_id: ${resources.pipelines.<project>_medallion.id}

        - task_key: build_features
          depends_on:
            - task_key: ingest
          notebook_task:
            notebook_path: ../src/ml/build_features.py

        - task_key: score
          depends_on:
            - task_key: build_features
          notebook_task:
            notebook_path: ../src/ml/score_batch.py
```

`${resources.pipelines.<name>.id}` references the pipeline the bundle already defines, so the job and the pipeline stay in sync.
Hardcoding a pipeline ID breaks the moment the bundle is deployed to a second target.

`pause_status: UNPAUSED` is explicit on purpose.
In a `development` target, DABs pauses schedules regardless, which is what stops every engineer's dev deploy from running the same cron.

## Task types

`databricks-jobs` covers notebooks, Python wheels, SQL, dbt, and pipeline tasks.
Two worth calling out for this journey:

- **`pipeline_task`** runs an SDP pipeline from section 6.
- **`sql_task`** runs a SQL file, which is how the metric views from section 8 get registered.

For conditional branching, fan-out over a list, or backfills, the skill has patterns and the [bundle examples knowledge base](https://github.com/databricks/bundle-examples/tree/main/knowledge_base) has working references (`job_conditional_execution`, `job_with_for_each`, `job_backfill_data`, `job_file_arrival`, `job_table_update_trigger`).

## Run

```bash
databricks bundle validate --strict --target dev --profile <name>
databricks bundle deploy --target dev --profile <name>
databricks bundle run <project>_daily --target dev --profile <name>
```

## Verify

```bash
# The run completed, and every task did
databricks bundle run <project>_daily --target dev --profile <name> -o json \
  | jq -r '.state.life_cycle_state + " " + (.state.result_state // "")'

databricks jobs get-run <run-id> --profile <name> -o json \
  | jq -r '.tasks[] | "\(.task_key)\t\(.state.life_cycle_state)\t\(.state.result_state // "")"'
```

Expect `TERMINATED SUCCESS` on the run and `SUCCESS` on every task.
A run reporting success with a task in `SKIPPED` means a dependency failed upstream, so read the task list rather than the run state alone.

Then confirm the schedule is actually armed, which is a separate thing from the job existing:

```bash
databricks jobs get <job-id> --profile <name> -o json \
  | jq '{name: .settings.name, cron: .settings.schedule.quartz_cron_expression, tz: .settings.schedule.timezone_id, paused: .settings.schedule.pause_status, run_as: .settings.run_as}'
```

Expect the cron, the timezone you intended, `UNPAUSED` in staging and production, and a service principal in `run_as` there.
`PAUSED` in a development target is correct.

And confirm the chain moved data end to end, not just that the tasks exited zero:

```bash
databricks api post /api/2.0/sql/statements --profile <name> --json '{
  "warehouse_id": "<warehouse-id>",
  "statement": "SELECT max(scored_at) AS latest_score, current_timestamp() AS now FROM <catalog>.<project>_gold.<entity>_predictions",
  "wait_timeout": "50s"
}' | jq -r '.result.data_array[0] | @tsv'
```

`latest_score` should be from this run.
An old timestamp with a green run means a task succeeded without doing work.

## Where this fails

| Symptom | Cause | Fix |
|---|---|---|
| Tasks run out of order | `depends_on` missing | Declare the dependency. Task order in the YAML means nothing. |
| Schedule never fires in dev | `mode: development` pauses schedules | Expected. Test with `bundle run`. |
| Job runs as whoever deployed last | No `run_as` on the production target | Set `run_as.service_principal_name`. See [Project repo](/docs/06-build-first-pipeline/project-repo). |
| Cron fires at the wrong hour | `timezone_id` omitted, so UTC was assumed | Set it explicitly |
| Pipeline task cannot find the pipeline | Hardcoded pipeline ID | Use `${resources.pipelines.<name>.id}` |
| Run green but data is stale | A task no-oped, for example a pipeline with nothing new to ingest | Check output freshness, not just exit status |
| Notifications never arrive | `email_notifications` on the task instead of the job, or a wrong alias | Put `on_failure` at the job level |

## Next

- **Do next:** [12. Data access control](/docs/12-data-access-control)
- **Manual fallback:** [Starter Journey: Orchestration](https://databricks-solutions.github.io/starter-journey/docs/12-orchestration/)
- **Reference:** [Lakeflow Jobs](https://docs.databricks.com/aws/en/jobs/)
