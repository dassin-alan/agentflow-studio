# Changelog

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
