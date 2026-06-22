# Contributing to AgentFlow

Thanks for your interest in contributing! AgentFlow is an open-source project and we welcome contributions of all kinds — code, docs, examples, bug reports, and feature ideas.

---

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful, be constructive, be kind.

---

## v0.1 Contribution Scope

AgentFlow is currently at v0.1.0 (static prototype). The best ways to contribute right now:

- 🎨 **Improve the static workspace** — the `index.html` demo is the main artifact. Better layout, clearer UI, more realistic mock data.
- 📋 **Add workflow examples** — new YAML workflows in `examples/` that demonstrate different use cases.
- ⚙️ **Refine agent configs** — improve `agents.yaml` with better role descriptions, fallback chains, or new agent types.
- 📖 **Write docs** — `docs/agent-protocol.md`, `docs/architecture.md`, `docs/workflow.md` are all open.
- 🐛 **Report bugs** — if something's broken or confusing, open an issue.

Full-stack contributions (Next.js, FastAPI, database) will be relevant from v0.2.0 onward.

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

### v0.1.0 (current)

No setup needed. Open `index.html` in your browser.

### v0.2.0+ (planned)

```bash
# Frontend (Next.js)
cd apps/web
pnpm install
pnpm dev          # http://localhost:3000

# Backend (FastAPI)
cd apps/api
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
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

- **HTML/CSS/JS:** Keep it vanilla for v0.1. No build step required.
- **YAML:** 2-space indentation. Comments for non-obvious fields.
- **JSON:** 2-space indentation. Validate against schema where applicable.
- **Python (v0.2+):** Ruff for linting and formatting. Type hints required.
- **TypeScript (v0.2+):** Strict mode. Prettier + ESLint.

### Documentation

- Use Markdown for all docs.
- Architecture decisions go in `docs/architecture.md`.
- API changes must update the relevant doc files.

---

## Agent Protocol Contributions

When adding a new agent type or modifying the protocol:

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
