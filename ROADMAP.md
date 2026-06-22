# Roadmap

## v0.1.0 - Static Manual Workspace

Goal: make the project understandable and runnable in minutes.

- Static web workspace
- Task intake
- Simulated task decomposition
- Agent role list
- Workflow graph
- Task board
- Collaboration log
- Manual agent output collection
- Final markdown export

## v0.2.0 - Local Workflow State

Goal: make the manual workflow useful across multiple sessions.

- Save tasks locally
- Edit generated subtasks
- Change assigned agent per task
- Change task status
- Export and import run records
- Add more workflow templates

## v0.3.0 - Agent Protocol

Goal: define the boundary between AgentFlow and external agents.

- `agent.json` schema
- `task.json` schema
- `agent-output.json` schema
- Workflow template schema
- Protocol examples

## v0.4.0 - API Adapters

Goal: connect real model or tool backends without changing the workflow model.

- OpenAI-compatible adapter
- Custom HTTP adapter
- Local command adapter
- Environment variable configuration
- Execution error reporting

## v0.5.0 - Review and Test Loop

Goal: add quality feedback to the orchestration loop.

- Reviewer agent step
- Tester agent step
- Return-to-fix workflow state
- Review report export
- Test report export

## v1.0.0 - Stable Open Source Release

Goal: provide a stable, documented local orchestration workspace.

- Visual workflow editor
- Plugin-style agent adapters
- Docker setup
- Complete docs
- Contribution guide
- Issue templates
