# Roadmap

This document outlines the development roadmap for AgentFlow. Versions are tagged with estimated difficulty for contributors.

---

## v0.1.0 — Static Demo 🚧

**Goal:** A working web UI that shows the core concept.

- [x] Project README with architecture diagram
- [x] Basic static web workspace (single HTML file, no build step)
- [x] Static agent list (7 predefined agents)
- [x] Task board with kanban columns
- [x] Workflow visualization (Mermaid diagram)
- [x] Collaboration log with timestamps
- [x] Final output display (Markdown synthesis)
- [x] Manual agent output fields (human-in-the-loop)
- [x] Markdown copy and JSON export/import
- [x] `agents.yaml` example configuration
- [x] `workflow.yaml` example configuration
- [x] Preview screenshot

**Deliverables:** Runnable frontend, README, screenshots, basic docs.

**Difficulty:** `good first issue`

---

## v0.2.0 — Local Runtime

**Goal:** Turn the static demo into a local-first agent collaboration runtime without adding a backend.

- [x] LocalStorage persistence
- [x] Restore workflow state on reload
- [x] Task state machine (`planned`, `active`, `review`, `done`, `blocked`, `failed`)
- [x] Editable task title, brief, agent, and status
- [x] Workflow step runner
- [x] Copy Agent Prompt
- [x] Structured agent output templates
- [x] Run Record export/import/replay
- [x] Clear local state
- [x] v0.2 documentation update

**Deliverables:** Single-file local runtime, persistent run state, manual agent handoff loop, replayable run records.

**Difficulty:** Medium.

---

## v0.3.0 — Agent Protocol 📋

**Goal:** Standardize how agents communicate.

- [ ] `agent.json` schema definition (JSON Schema)
- [ ] `task.json` input/output schema
- [ ] `workflow.json` configuration schema
- [ ] Prompt template system with variable substitution
- [ ] Agent output validation
- [ ] Protocol documentation (open spec)
- [ ] Example agents with sample I/O

**Deliverables:** Agent Protocol spec, validation library, docs.

**Difficulty:** Medium — requires API design experience.

---

## v0.4.0 — API Integration 📋

**Goal:** Connect to real AI model APIs and introduce backend-backed storage.

- [ ] OpenAI-compatible API adapter
- [ ] Anthropic (Claude) API adapter
- [ ] DeepSeek API adapter
- [ ] Gemini API adapter
- [ ] Custom endpoint support
- [ ] Environment variable configuration (`.env`)
- [ ] Backend scheduler (FastAPI)
- [ ] SQLite / PostgreSQL storage
- [ ] Real-time execution logs
- [ ] Error handling and retry logic

**Deliverables:** Working backend with real agent execution and durable server-side storage.

**Difficulty:** Medium-High.

---

## v0.5.0 — Review & Test Loop 📋

**Goal:** Automated quality gates in the workflow.

- [ ] Reviewer agent with configurable review lenses
- [ ] Tester agent with test case generation
- [ ] Auto-rework trigger (failed review → back to coder)
- [ ] Test report generation
- [ ] Code review report generation
- [ ] Quality score dashboard

**Deliverables:** Closed-loop quality system.

**Difficulty:** High.

---

## v1.0.0 — Stable Release 🎯

**Goal:** Production-ready open-source release.

- [ ] Visual workflow editor (React Flow)
- [ ] Agent plugin system
- [ ] Workflow template marketplace
- [ ] Task history and analytics
- [ ] Export results (Markdown, PDF, JSON)
- [ ] Docker deployment (one-command setup)
- [ ] Complete documentation site
- [ ] Contribution guide with video walkthrough
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Test coverage > 80%

**Deliverables:** Full open-source release.

**Difficulty:** High — multiple complex subsystems.

---

## Future Ideas

- **Multi-user workspaces** — team collaboration on shared workflows
- **Cloud sync** — sync agent configs and workflows across machines
- **GitHub integration** — trigger workflows from PRs and issues
- **Agent marketplace** — community-contributed agent definitions
- **Voice interface** — speak tasks, hear results
- **Mobile companion** — monitor workflows from your phone

---

## How to Contribute

Pick an issue tagged `good first issue` from the [GitHub Issues](https://github.com/dassin-alan/agentflow-studio/issues) page. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR.

For larger features (v0.3.0+), please open an RFC issue first to discuss the design.
