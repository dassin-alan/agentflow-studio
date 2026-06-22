# Agent Protocol Draft

AgentFlow v0.1 uses this document as a draft contract. The web demo is manual, but future adapters should preserve the same boundaries.

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

## Task Input

```json
{
  "id": "task-001",
  "title": "Generate core code",
  "type": "frontend",
  "assigned_to": "coder",
  "status": "planned",
  "input": {
    "goal": "Create an interactive 3D Earth website",
    "constraints": [
      "single HTML file",
      "mouse rotation",
      "wheel zoom",
      "cyberpunk style"
    ]
  },
  "expected_output": "HTML code"
}
```

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

## Design Rules

- Agents can be manual, API-backed, local-command backed, or custom HTTP services.
- Workflow state should not depend on a single model provider.
- Every task should have a stable id, assigned agent, status, input, and expected output.
- Every agent output should be append-only in the run record.
- Human review is part of the protocol, not an exception.
