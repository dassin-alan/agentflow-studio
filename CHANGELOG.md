# Changelog

## Unreleased

- Added downstream task invalidation when a completed dependency is rolled back (post-v0.2.1 fix, commit `bd04c86`).
- Added a GitHub Actions CI workflow that runs the local runtime tests on pushes to `master` and on every pull request.
- Added a cap of 200 entries on the collaboration log to keep `localStorage` state and exported run records bounded.
- Consolidated duplicated task status text logic in the workflow and board views into a shared `getTaskStatusPresentation` helper.
- Removed the unused `validateDependencyGraph` function (import validation already covers duplicate ids, unknown references, self-dependencies, and cycles).
- Clarified in the README that task decomposition currently uses built-in workflow templates; model-driven planning is planned for v0.4.
- Added tests for log capping, preset selection, and import validation rejection paths (cycles, duplicate ids, unknown dependencies).
- Aligned contribution, security, workflow, and protocol copy with the local-first, human-in-the-loop v0.2.1 runtime.

## v0.2.1 - Dependency-aware Local Runtime

- Added DAG-based task dependencies with `dependsOn` on tasks and workflow steps.
- Added Ready / Waiting dependency states and dependency badges on workflow and board cards.
- Added dependency context sections to generated agent prompts.
- Added RunRecord validation on import: duplicate ids, unknown references, self-dependencies, and cycle detection.

## v0.2.0 - Local Runtime

- Added `window.AgentFlowState` as the persistent local runtime state object.
- Added browser `localStorage` save and restore for goals, tasks, workflow steps, outputs, logs, current step, and final markdown.
- Added task states: `planned`, `active`, `review`, `done`, `blocked`, and `failed`.
- Added editable task title, brief, assigned agent, and status controls.
- Added manual workflow step runner with current step tracking.
- Added structured Agent Prompt generation and copy support.
- Added complete Run Record JSON export/import/replay.
- Added Clear Local State and Reset Run controls.
- Updated README and ROADMAP to define v0.2 as a single-file local runtime.

Deferred from v0.2:

- Backend services
- API agent adapters
- FastAPI
- Next.js / React
- SQLite / PostgreSQL
- Multi-user cloud sync

## v0.1.0 - Static Demo

- Added the first single-file AgentFlow workspace prototype.
- Added static agent list, task decomposition presets, task board, Mermaid workflow view, collaboration log, manual output fields, markdown export, and JSON import/export.
