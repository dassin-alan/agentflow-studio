# Agent Protocol

AgentFlow defines a standard JSON protocol so any agent — regardless of model or provider — can participate in a workflow. This document is the draft specification.

---

## Agent

```json
{
  "id": "coder",
  "name": "Coder",
  "role": "Build",
  "provider": "manual",
  "model": "external-tool",
  "description": "Implements the core artifact."
}
```

### Agent Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (used in workflow steps) |
| `name` | string | ✅ | Display name |
| `role` | string | ✅ | Functional role (Planner, Build, Visual, Ops, Review, QA, Docs) |
| `provider` | string | ✅ | Model provider or `manual` |
| `model` | string | ✅ | Model identifier |
| `description` | string | ❌ | What this agent does best |

---

## Task Input

```json
{
  "task_id": "task-001",
  "workflow_id": "frontend-demo",
  "agent": "coder",
  "role": "Code Engineer",
  "goal": "Build a cyberpunk 3D earth website",
  "constraints": [
    "single HTML file",
    "mouse rotation",
    "wheel zoom",
    "manual handoff"
  ],
  "expected_output": "HTML code",
  "handoff_mode": "human-in-the-loop"
}
```

### Task Input Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | ✅ | Unique task identifier |
| `workflow_id` | string | ✅ | Parent workflow identifier |
| `agent` | string | ✅ | Agent id assigned to this task |
| `role` | string | ✅ | Role label for context |
| `goal` | string | ✅ | Natural language description of what to produce |
| `constraints` | string[] | ❌ | Hard constraints for the agent |
| `expected_output` | string | ✅ | Format or type of expected output |
| `handoff_mode` | string | ✅ | How this task hands off (see below) |

---

## Agent Output

```json
{
  "task_id": "task-001",
  "agent": "coder",
  "status": "completed",
  "output": "Generated code or summary text",
  "issues": [],
  "next_steps": [
    "Send to reviewer",
    "Run visual QA"
  ]
}
```

### Agent Output Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | ✅ | References the input task |
| `agent` | string | ✅ | Agent that produced this output |
| `status` | string | ✅ | Task status after execution (see below) |
| `output` | string | ✅ | The agent's result — code, text, review, test report, etc. |
| `issues` | object[] | ❌ | Problems found during execution |
| `next_steps` | string[] | ❌ | Recommended follow-up actions |

---

## Task Status

| Status | Meaning |
|--------|---------|
| `planned` | Task created, not yet started |
| `active` | Task currently being worked on |
| `review` | Agent output produced, pending review |
| `done` | Task completed and approved |
| `blocked` | Cannot proceed — dependency failed or external blocker |
| `failed` | Unrecoverable error encountered |

---

## Handoff Mode

| Mode | Description | Available |
|------|-------------|-----------|
| `manual` | User copies task to external tool and pastes result back. | v0.1 ✅ |
| `api` | AgentFlow calls a model API with the task and collects the response. | v0.4+ 📋 |
| `shell` | AgentFlow runs a local CLI command and captures stdout. | v0.4+ 📋 |
| `http` | AgentFlow sends the task to a custom HTTP endpoint. | v0.4+ 📋 |

---

## Run Record

A run record captures one complete workflow execution:

```json
{
  "version": "0.1.0",
  "exported_at": "2026-06-22T12:00:00Z",
  "goal": "Build a cyberpunk 3D earth website...",
  "agents": [
    {
      "id": "coder",
      "name": "Coder",
      "role": "Build",
      "description": "Implements the core artifact."
    }
  ],
  "tasks": [
    {
      "id": "task-001",
      "order": 3,
      "title": "Generate core code",
      "agent": "coder",
      "status": "done",
      "brief": "Create the first working version.",
      "output": "<html>..."
    }
  ],
  "logs": [
    {
      "time": "14:32:01",
      "actor": "Commander",
      "message": "Created 8 subtasks from the user request."
    }
  ],
  "final_markdown": "# AgentFlow Run Record\n..."
}
```

### Run Record Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | AgentFlow version that produced this record |
| `exported_at` | string | ISO 8601 timestamp |
| `goal` | string | Original user goal |
| `agents` | object[] | Agent definitions used in this run |
| `tasks` | object[] | All tasks with their inputs and outputs |
| `logs` | object[] | Timestamped log entries |
| `final_markdown` | string | Synthesized Markdown report |

---

## Workflow Step

A step within a workflow configuration:

```json
{
  "id": "implement",
  "agent": "coder",
  "action": "generate_code",
  "depends_on": ["plan"],
  "handoff_mode": "manual",
  "input": "Technical plan and requirements",
  "timeout": 600
}
```

### Workflow Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Step identifier |
| `agent` | string | ✅ | Agent id (references an agent) |
| `action` | string | ✅ | What the agent should do |
| `depends_on` | string[] | ✅ | Step ids that must complete first |
| `handoff_mode` | string | ✅ | `manual` / `api` / `shell` / `http` |
| `input` | string | ❌ | Hint describing input data for this step |
| `timeout` | number | ❌ | Max seconds (0 = no limit) |

---

## Design Rules

1. **Provider-agnostic.** Agents can be manual, API-backed, local-command backed, or custom HTTP services. Workflow state must not depend on a single model provider.
2. **Stable identities.** Every task must have a stable `task_id`, assigned `agent`, `status`, `input`, and `expected_output`.
3. **Append-only log.** Every agent output must be append-only in the run record. No overwriting history.
4. **Human-in-the-loop is first-class.** Human review is part of the protocol, not an exception. Every step supports `handoff_mode: manual`.
5. **Gradual automation.** Changing `handoff_mode` from `manual` to `api` should be the only change needed to automate a workflow step.
6. **Portable records.** Run records must be self-contained — no external references, no server-side state.
