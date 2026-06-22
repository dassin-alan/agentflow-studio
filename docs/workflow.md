# Workflow System

AgentFlow workflows are defined in YAML and executed step-by-step. This document describes the workflow model.

---

## Workflow Structure

A workflow is a named sequence of steps, each assigned to an agent:

```yaml
name: Frontend Project
description: Generate a complete frontend project from a user request.
triggers:
  - "build a website"
  - "create a frontend"
  - "make a page"
steps:
  - id: analyze
    agent: commander
    action: analyze_requirements
    depends_on: []
    handoff_mode: manual
    input: "User request description"
    timeout: 120

  - id: implement
    agent: coder
    action: generate_code
    depends_on: [analyze]
    handoff_mode: manual
    input: "Requirements from analysis step"
    timeout: 600
output: "Complete frontend project."
```

---

## Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique step identifier within the workflow |
| `agent` | string | ✅ | Agent id (references `agents.yaml`) |
| `action` | string | ✅ | What the agent should do (e.g. `analyze_requirements`) |
| `depends_on` | string[] | ✅ | Step ids that must complete before this step starts |
| `handoff_mode` | enum | ✅ | How this step hands off — `manual`, `api`, `shell`, or `http` |
| `input` | string | ❌ | Hint describing what input data this step receives |
| `timeout` | number | ❌ | Maximum seconds allowed for this step (0 = no limit) |

---

## Handoff Modes

| Mode | Description | Available |
|------|-------------|-----------|
| `manual` | User copies task to an external tool and pastes the result back. | v0.1 ✅ |
| `api` | AgentFlow sends the task to a model API and collects the response. | v0.4+ 📋 |
| `shell` | AgentFlow runs a local CLI command and captures stdout. | v0.4+ 📋 |
| `http` | AgentFlow sends the task to a custom HTTP endpoint. | v0.4+ 📋 |

The `handoff_mode` field is the key to AgentFlow's gradual upgrade path. A workflow defined with `manual` today becomes fully automated by changing one field tomorrow.

---

## Task States

Every task in a workflow run moves through these states:

```text
planned → active → review → done
                   ↘ blocked
                      ↘ failed
```

| State | Meaning |
|-------|---------|
| `planned` | Task created but not yet started |
| `active` | Task currently in progress |
| `review` | Task output produced, awaiting review |
| `done` | Task completed and approved |
| `blocked` | Task cannot proceed (dependency failed or external blocker) |
| `failed` | Task encountered an unrecoverable error |

---

## Dependency Model

Steps declare dependencies via `depends_on`. The workflow engine resolves them into a DAG:

```yaml
# Parallel execution example
steps:
  - id: review_correctness
    agent: reviewer
    depends_on: []

  - id: review_security
    agent: reviewer
    depends_on: []

  - id: review_performance
    agent: reviewer
    depends_on: []

  - id: synthesize
    agent: reviewer
    depends_on: [review_correctness, review_security, review_performance]
```

Steps with empty `depends_on: []` can run immediately. Steps that depend on others wait for those to complete. In v0.1 manual mode, the user decides the order. In v0.4+ automated mode, the engine respects the DAG.

---

## Run Record

Every workflow execution produces a run record:

```json
{
  "version": "0.1.0",
  "exported_at": "2026-06-22T12:00:00Z",
  "goal": "Build a cyberpunk 3D earth website...",
  "agents": [...],
  "tasks": [...],
  "logs": [...],
  "final_markdown": "# AgentFlow Run Record\n..."
}
```

Run records are the unit of persistence, export, and import. They capture the full execution trace: every task, every agent output, and every log entry.

---

## Workflow vs Template

- **Workflow** (`workflow.yaml`): A reusable step sequence. Like a function definition.
- **Run Record**: One concrete execution of a workflow. Like a function call with real inputs and outputs.

In v0.1, the user manually chooses a preset (frontend or generic) when decomposing. In future versions, workflows will be selectable from `workflow.yaml`.
