# Contributing to AgentFlow

Thanks for your interest in contributing! AgentFlow is an open-source project and we welcome contributions of all kinds — code, docs, examples, bug reports, and feature ideas.

---

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful, be constructive, be kind.

---

## Current Contribution Scope

AgentFlow is currently at v0.2.1 (Dependency-aware Local Runtime). The best ways to contribute right now:

- 🎨 **Improve the local workspace** — `index.html` is the main artifact. Keep it single-file, local-first, and human-in-the-loop.
- 📋 **Add workflow examples** — new YAML workflows in `examples/` that demonstrate different use cases.
- ⚙️ **Refine agent configs** — improve `agents.yaml` with better role descriptions, fallback chains, or new agent types.
- 📖 **Write docs** — `docs/agent-protocol.md`, `docs/architecture.md`, `docs/workflow.md` are all open.
- 🐛 **Report bugs** — if something's broken or confusing, open an issue.

Agent Protocol work is planned for v0.3. Backend services, model API adapters, and database storage are deferred to v0.4 and are outside the current contribution scope.

---

## How to Contribute

### 🐛 Reporting Bugs

1. Search [existing issues](https://github.com/dassin-alan/agentflow-studio/issues) to avoid duplicates.
2. Use the **Bug Report** template.
3. Include: steps to reproduce, expected behavior, actual behavior, and your environment (OS, browser).

### 💡 Feature Requests

1. Search [existing issues](https://github.com/dassin-alan/agentflow-studio/issues) first.
2. Use the **Feature Request** template.
3. Explain: what problem it solves, who it helps, and any implementation ideas.

### 🔧 Code Contributions

1. **Find an issue** — Look for [`good first issue`](https://github.com/dassin-alan/agentflow-studio/labels/good%20first%20issue) or ask in an existing issue.
2. **Fork & branch** — Fork the repo, create a feature branch (`feat/your-feature` or `fix/your-fix`).
3. **Write clearly** — Keep it readable. Match the style of surrounding code.
4. **Update docs** — If you change APIs or configuration, update the relevant docs.
5. **Open a PR** — Fill in the PR template. Link the issue it closes.
6. **Code review** — A maintainer will review. Be open to feedback.

---

## Development Setup

### v0.2.1 (current)

No dependency installation or build step is required. Open `index.html` directly, or serve the repository with a local static server for browser testing.

Run the dependency-aware local runtime tests with Node.js:

```bash
node tests/local-runtime.test.js
```

---

## Project Conventions

### Git

- **Branch naming:** `feat/short-description`, `fix/short-description`, `docs/short-description`
- **Commit messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat: add agent configuration system`
  - `fix: resolve task status persistence bug`
  - `docs: update agent protocol specification`

### Code Style

- **HTML/CSS/JS:** Keep the v0.2.x runtime vanilla and single-file. No build step is required.
- **YAML:** 2-space indentation. Comments for non-obvious fields.
- **JSON:** 2-space indentation. Validate against schema where applicable.

### Documentation

- Use Markdown for all docs.
- Architecture decisions go in `docs/architecture.md`.
- Runtime state, RunRecord, and configuration changes must update the relevant doc files.

---

## Agent Protocol Contributions

Agent Protocol is a planned v0.3 milestone. Open an RFC issue before changing the draft protocol. When an approved protocol change is implemented:

1. Update `docs/agent-protocol.md`.
2. Add an example in `examples/`.
3. Update `agents.yaml` if adding a new agent role.
4. Ensure backward compatibility or document breaking changes.

---

## Getting Help

- 💬 Ask in [GitHub Discussions](https://github.com/dassin-alan/agentflow-studio/discussions)
- 🐛 Report bugs in [Issues](https://github.com/dassin-alan/agentflow-studio/issues)
- 📖 Read the [docs](./docs/)

---

## Recognition

All contributors are listed in the [README](./README.md) and the project's contributors page. Every contribution — even a typo fix — is appreciated.
