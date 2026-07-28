# UI Language Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent English/Simplified Chinese interface toggle without translating or mutating AgentFlow runtime data.

**Architecture:** Keep localization inside the existing `index.html` as a small `AgentFlowI18n` unit with a translation catalog, a `t()` helper, declarative attributes for static copy, and explicit calls from dynamic render functions. Store the selected language under a dedicated localStorage key so runtime state and RunRecords remain unchanged.

**Tech Stack:** Single-file HTML, Vanilla JavaScript, localStorage, existing Node `vm` test harness, Chrome browser acceptance.

---

## File Map

- Modify `index.html`: language button, catalog, language controller, static translation attributes, and dynamic UI translation calls.
- Modify `tests/local-runtime.test.js`: richer DOM test doubles and bilingual UI regression tests.
- Modify `README.md`: document the interface language toggle.
- Keep `VERSION`, runtime storage schema, task data, prompts, logs, outputs, and RunRecord serialization unchanged.

### Task 1: Add Failing Language Controller Tests

**Files:**
- Modify: `tests/local-runtime.test.js`

- [ ] **Step 1: Extend the DOM test double for language attributes**

Add attribute storage and a document root:

```js
class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.innerHTML = "";
    this.textContent = "";
    this.dataset = {};
    this.files = [];
    this.listeners = {};
    this.className = "";
    this.style = {};
    this.attributes = {};
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    this[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }
}
```

Add `languageToggle` and `localOnlyLabel` to `requiredIds`. Give
`localOnlyLabel` a `data-i18n="header.localOnly"` attribute. Return a
`documentElement`, and implement attribute selection:

```js
const documentElement = new FakeElement("html");
elements.get("localOnlyLabel").setAttribute("data-i18n", "header.localOnly");

return {
  body: new FakeElement("body"),
  documentElement,
  // existing createElement() and getElementById()
  querySelectorAll(selector) {
    const match = selector.match(/^\[([^\]]+)\]$/);
    if (!match) return [];
    return [...elements.values()].filter(element => element.getAttribute(match[1]) !== null);
  }
};
```

- [ ] **Step 2: Allow reload tests to reuse localStorage**

Change the loader signature and assignment:

```js
function loadRuntime(options = {}) {
  const storage = options.localStorage || createLocalStorage();
  // existing setup
  const context = {
    // existing fields
    localStorage: storage
  };
  // existing evaluation
}
```

- [ ] **Step 3: Write the controller behavior test**

Add:

```js
function testInterfaceLanguageToggleAndPersistence() {
  const storage = createLocalStorage();
  const { context } = loadRuntime({ localStorage: storage });
  const i18n = context.window.AgentFlowI18n;

  assert.ok(i18n, "window.AgentFlowI18n should expose the UI language controller");
  assert.strictEqual(i18n.getLanguage(), "en");
  assert.strictEqual(context.document.documentElement.lang, "en");
  assert.strictEqual(context.document.getElementById("localOnlyLabel").textContent, "Local Only");

  const runtimeBefore = JSON.stringify(context.window.AgentFlowState);
  i18n.toggleLanguage();

  assert.strictEqual(i18n.getLanguage(), "zh-CN");
  assert.strictEqual(context.document.documentElement.lang, "zh-CN");
  assert.strictEqual(context.document.getElementById("localOnlyLabel").textContent, "仅限本地");
  assert.strictEqual(context.document.getElementById("languageToggle").textContent, "EN");
  assert.strictEqual(storage.getItem("agentflow:ui-language"), "zh-CN");
  assert.strictEqual(JSON.stringify(context.window.AgentFlowState), runtimeBefore);

  const reloaded = loadRuntime({ localStorage: storage }).context;
  assert.strictEqual(reloaded.window.AgentFlowI18n.getLanguage(), "zh-CN");

  reloaded.window.AgentFlowI18n.toggleLanguage();
  assert.strictEqual(reloaded.window.AgentFlowI18n.getLanguage(), "en");
  assert.strictEqual(reloaded.document.getElementById("languageToggle").textContent, "中文");
}
```

Register the test before `LOCAL_RUNTIME_TESTS_OK`.

- [ ] **Step 4: Add preference fallback coverage**

Add this test before implementation so both fallback paths begin RED:

```js
function testLanguagePreferenceFallbacks() {
  const invalidStorage = createLocalStorage();
  invalidStorage.setItem("agentflow:ui-language", "fr");
  const invalidContext = loadRuntime({ localStorage: invalidStorage }).context;
  assert.strictEqual(invalidContext.window.AgentFlowI18n.getLanguage(), "en");

  const blockedStorage = createLocalStorage();
  blockedStorage.setItem = () => { throw new Error("storage blocked"); };
  const blockedContext = loadRuntime({ localStorage: blockedStorage }).context;
  assert.doesNotThrow(() => blockedContext.window.AgentFlowI18n.setLanguage("zh-CN"));
  assert.strictEqual(blockedContext.window.AgentFlowI18n.getLanguage(), "zh-CN");
}
```

Register this test before `LOCAL_RUNTIME_TESTS_OK`.

- [ ] **Step 5: Run the tests and verify RED**

Run:

```powershell
node tests/local-runtime.test.js
```

Expected: FAIL because `window.AgentFlowI18n` does not exist.

### Task 2: Implement the Persistent Language Controller

**Files:**
- Modify: `index.html`
- Test: `tests/local-runtime.test.js`

- [ ] **Step 1: Add the stable header control**

Place this button before the `Local Only` badge:

```html
<button
  id="languageToggle"
  type="button"
  class="btn language-toggle text-xs"
  title="Switch to Chinese"
  aria-label="Switch to Chinese"
>中文</button>
```

Give the local-only text span `id="localOnlyLabel"` and
`data-i18n="header.localOnly"`. Add:

```css
.language-toggle {
  min-width: 4.25rem;
  justify-content: center;
  white-space: nowrap;
}
```

- [ ] **Step 2: Add the language state and core catalog**

Add after the runtime constants:

```js
const LANGUAGE_STORAGE_KEY = "agentflow:ui-language";
const SUPPORTED_LANGUAGES = ["en", "zh-CN"];
const translations = {
  en: {
    "header.localOnly": "Local Only",
    "language.switchToChinese": "Switch to Chinese",
    "language.switchToEnglish": "Switch to English"
  },
  "zh-CN": {
    "header.localOnly": "仅限本地",
    "language.switchToChinese": "切换为中文",
    "language.switchToEnglish": "切换为英文"
  }
};
let currentLanguage = "en";
```

- [ ] **Step 3: Add the language controller**

```js
function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : "en";
}

function t(key, params = {}) {
  const languageCatalog = translations[currentLanguage] || translations.en;
  const template = languageCatalog[key] || translations.en[key] || key;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll("{" + name + "}", String(value)),
    template
  );
}

function loadLanguagePreference() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

function applyStaticTranslations() {
  if (!document.querySelectorAll) return;
  const bindings = [
    ["[data-i18n]", "data-i18n", "textContent"],
    ["[data-i18n-placeholder]", "data-i18n-placeholder", "placeholder"],
    ["[data-i18n-title]", "data-i18n-title", "title"],
    ["[data-i18n-aria-label]", "data-i18n-aria-label", "aria-label"]
  ];
  bindings.forEach(([selector, attribute, target]) => {
    document.querySelectorAll(selector).forEach(element => {
      const key = element.getAttribute(attribute);
      if (!key) return;
      if (target === "textContent") element.textContent = t(key);
      else element.setAttribute(target, t(key));
    });
  });
}

function updateLanguageControl() {
  const button = getEl("languageToggle");
  if (!button) return;
  const isEnglish = currentLanguage === "en";
  button.textContent = isEnglish ? "中文" : "EN";
  const action = t(isEnglish ? "language.switchToChinese" : "language.switchToEnglish");
  button.setAttribute("title", action);
  button.setAttribute("aria-label", action);
}

function setLanguage(language, options = {}) {
  currentLanguage = normalizeLanguage(language);
  if (document.documentElement) document.documentElement.lang = currentLanguage;
  if (options.persist !== false) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch (error) {
      console.warn("AgentFlow language preference save failed", error);
    }
  }
  applyStaticTranslations();
  updateLanguageControl();
  if (options.render !== false && state) renderAll();
  return currentLanguage;
}

function toggleLanguage() {
  return setLanguage(currentLanguage === "en" ? "zh-CN" : "en");
}

function getLanguage() {
  return currentLanguage;
}
```

- [ ] **Step 4: Bind and initialize the control**

In `bindStaticEvents()`:

```js
getEl("languageToggle").addEventListener("click", toggleLanguage);
```

At the beginning of `boot()`:

```js
setLanguage(loadLanguagePreference(), { persist: false, render: false });
```

Expose:

```js
window.AgentFlowI18n = { getLanguage, setLanguage, toggleLanguage, t };
```

- [ ] **Step 5: Run the tests and verify GREEN**

Run:

```powershell
node tests/local-runtime.test.js
```

Expected: `LOCAL_RUNTIME_TESTS_OK`.

- [ ] **Step 6: Commit the controller slice**

```powershell
git add index.html tests/local-runtime.test.js
git diff --cached --check
git commit -m "feat: add persistent interface language toggle"
```

### Task 3: Localize Static Interface Copy

**Files:**
- Modify: `index.html`
- Test: `tests/local-runtime.test.js`

- [ ] **Step 1: Write a failing static coverage test**

Read every `data-i18n*` key from the HTML and assert it resolves in both
languages:

```js
function testDeclaredInterfaceTranslationsResolve() {
  const { context } = loadRuntime();
  const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const keys = [...html.matchAll(/data-i18n(?:-placeholder|-title|-aria-label)?="([^"]+)"/g)]
    .map(match => match[1]);

  assert.ok(keys.length >= 35, "the static interface should declare translation keys");
  for (const language of ["en", "zh-CN"]) {
    context.window.AgentFlowI18n.setLanguage(language, { persist: false });
    keys.forEach(key => {
      assert.notStrictEqual(context.window.AgentFlowI18n.t(key), key, `${language} is missing ${key}`);
    });
  }
}
```

Run `node tests/local-runtime.test.js`.

Expected: FAIL on the first undeclared catalog entry.

- [ ] **Step 2: Add translation attributes to all static surfaces**

Cover these exact groups:

- Header subtitle and local-only status.
- Hero eyebrow, headline, body, actions, four metric captions, and four process labels.
- Agent Team title, Runtime Config, Local Orchestration title, and description.
- Task Intake title, mode badge, goal placeholder, four intake process labels, and five action buttons.
- Workflow Runner and Task Board titles plus six board column headings.
- Prompt Preview, Handoff Text, Agent Outputs, Final Output, Collaboration Log, and Telemetry State.
- Final output buttons and all initial empty states.
- Footer runtime description, local-first text, replay text, and `Powered by`.

Use `data-i18n` for text, `data-i18n-placeholder` for form hints, and the
title/ARIA variants only where the attribute exists.

- [ ] **Step 3: Complete both catalogs**

Add matching English and Simplified Chinese entries for every declared key.
Use concise product terminology consistently:

- Task = `任务`
- Workflow = `工作流`
- Run = `运行`
- RunRecord = `运行记录`
- Agent = `Agent`
- Ready / Waiting = `就绪` / `等待`
- Local Only = `仅限本地`

Do not add catalog entries for user data or run content.

- [ ] **Step 4: Run and commit**

Run:

```powershell
node tests/local-runtime.test.js
git diff --check
```

Expected: `LOCAL_RUNTIME_TESTS_OK` and no diff errors.

Commit:

```powershell
git add index.html tests/local-runtime.test.js
git commit -m "feat: localize static workspace interface"
```

### Task 4: Localize Dynamic Interface Copy Without Mutating State

**Files:**
- Modify: `index.html`
- Modify: `tests/local-runtime.test.js`

- [ ] **Step 1: Write a failing dynamic rendering test**

```js
function testDynamicInterfaceCopySwitchesWithoutTranslatingRunData() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;
  const i18n = context.window.AgentFlowI18n;

  context.document.getElementById("goalInput").value = "Build a bilingual control panel";
  runtime.decompose();
  const stateBefore = JSON.stringify(context.window.AgentFlowState);

  i18n.setLanguage("zh-CN");

  assert.match(context.document.getElementById("taskMetric").textContent, /个任务$/);
  assert.match(context.document.getElementById("agentList").innerHTML, /准备就绪|运行中/);
  assert.match(context.document.getElementById("runProgressView").innerHTML, /当前运行进度/);
  assert.match(context.document.getElementById("flowView").innerHTML, /运行步骤/);
  assert.match(context.document.getElementById("col-planned").innerHTML, /运行|提示词|删除/);
  assert.match(context.document.getElementById("outputInputs").innerHTML, /提交输出/);
  assert.strictEqual(JSON.stringify(context.window.AgentFlowState), stateBefore);
  assert.strictEqual(context.window.AgentFlowState.goal, "Build a bilingual control panel");
}
```

Run `node tests/local-runtime.test.js`.

Expected: FAIL because dynamic render functions still output English.

- [ ] **Step 2: Translate dynamic labels through `t()`**

Replace UI-owned literals in:

- `renderAgents()`: role, description, Running, and Ready.
- `getDependencyBadge()` and `getTaskStatusPresentation()`: terminal, ready, and waiting labels.
- `renderProgress()`: title, completion count, and seven status counters.
- `renderFlow()`: empty state, current-step metric, Expected, Run Step, and Copy Prompt.
- `renderBoard()`: empty-column copy, Step, Assignee, Status, field ARIA labels, Run, Prompt, and Delete.
- `renderOutputInputs()`: empty state, Step, placeholder, Submit Output, and Mark Done.
- `renderLogs()`: empty state only; existing log messages remain untouched.
- `renderAll()`: final-output empty state.
- `updateMetrics()`: task and log counters.

Use named parameters for mixed data:

```js
t("metrics.tasks", { count: state.tasks.length })
t("workflow.nextStep", { order: current.order, title: current.title })
t("dependency.waitingFor", { items: titles.join(", ") })
```

Task titles, dependency titles, agent names/tools, goals, expected outputs, logs,
prompts, outputs, and Markdown continue to come directly from state.

Keep the canonical `statusLabels` object in English because final Markdown uses
it. Add `getStatusLabel(status)` for translated UI badges and select options.
Likewise, keep `describeDependencyBlock()` canonical for logs and add a
UI-specific translated dependency label for cards and badges.

- [ ] **Step 3: Localize Agent role metadata at render time**

Keep the `agents` array unchanged. Add catalog keys such as:

```js
"agent.commander.role": "规划",
"agent.commander.description": "澄清目标、拆分工作并负责最终决策。"
```

Render translated role and description via the agent ID. Never assign
translations back into `agents` or `state.agents`.

- [ ] **Step 4: Localize UI feedback**

Translate only these user-facing notifications and confirmations:

- Delete task confirmation.
- Blocked-step warning toast.
- Saved-output success toast.
- Import validation error toast.
- Import success, cancellation, and invalid-file toasts.
- Import replacement confirmation.
- Reset-run confirmation.
- Clear-local-state confirmation.

Keep every `addLog()` message in canonical English. When a function currently
shares one string between a log entry and a toast, retain the English log
string and build a separate localized toast with `t()`.

- [ ] **Step 5: Run and commit**

Run:

```powershell
node tests/local-runtime.test.js
git diff --check
```

Expected: `LOCAL_RUNTIME_TESTS_OK`.

Commit:

```powershell
git add index.html tests/local-runtime.test.js
git commit -m "feat: localize dynamic workspace controls"
```

### Task 5: Document and Verify the Feature

**Files:**
- Modify: `README.md`
- Verify: `index.html`
- Verify: `tests/local-runtime.test.js`

- [ ] **Step 1: Update README**

Add one feature bullet stating that the workspace supports an English /
Simplified Chinese interface toggle and persists the local preference. State
that workflow data and RunRecords are not translated.

- [ ] **Step 2: Run final static verification**

```powershell
node tests/local-runtime.test.js
node -e "const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const scripts=[...html.matchAll(/<script(?:[^>]*)>([\\s\\S]*?)<\\/script>/g)].map(m=>m[1]).filter(Boolean);scripts.forEach((s,i)=>{new Function(s);console.log('SCRIPT_PARSE_OK',i+1)});"
git diff --check
```

Expected:

```text
LOCAL_RUNTIME_TESTS_OK
SCRIPT_PARSE_OK 1
```

- [ ] **Step 3: Run browser acceptance**

Serve the isolated worktree on an unused localhost port. In Chrome:

1. Confirm English is the initial language with cleared language preference.
2. Create a workflow and record the task count and goal text.
3. Click `中文`; confirm header, sections, buttons, statuses, empty states, and Agent descriptions switch immediately.
4. Confirm the goal, task titles, prompt preview, logs, outputs, and exported RunRecord remain unchanged.
5. Reload and confirm Chinese persists.
6. Click `EN` and confirm English returns.
7. At `390x844`, confirm the header wraps cleanly with no horizontal overflow.
8. Confirm keyboard activation, focus visibility, and zero uncaught page errors.

Capture one desktop Chinese screenshot and one mobile Chinese screenshot outside
the Git worktree.

- [ ] **Step 4: Commit documentation**

```powershell
git add README.md
git commit -m "docs: document bilingual interface toggle"
```

### Task 6: Review and Integrate

**Files:**
- Review all feature branch changes.

- [ ] **Step 1: Review the complete branch**

```powershell
git status --short --branch
git diff master...HEAD --stat
git diff master...HEAD --check
git log --oneline --decorate master..HEAD
```

Confirm no change to `VERSION`, RunRecord schema, presets, task content,
dependency behavior, tags, or remote refs.

- [ ] **Step 2: Run final tests from branch HEAD**

Run the Task 5 static verification commands again after the final commit.

- [ ] **Step 3: Fast-forward authoritative master**

Only after both worktrees are clean and ancestry succeeds:

```powershell
git -C "C:\Users\ROG\agentflow-studio" merge-base --is-ancestor master feature/v0.2.2-ui-language-toggle
git -C "C:\Users\ROG\agentflow-studio-v0.2-local-runtime" merge --ff-only feature/v0.2.2-ui-language-toggle
```

- [ ] **Step 4: Verify integrated master**

```powershell
node tests/local-runtime.test.js
git diff --check
git status --short --branch
git log -n 5 --oneline --decorate
```

Do not push, tag, delete the feature branch, delete worktrees, or change
`VERSION` without separate approval.
