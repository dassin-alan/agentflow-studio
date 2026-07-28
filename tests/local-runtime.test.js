const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");

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

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  appendChild() {}

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    this[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }

  remove() {}

  click() {
    if (this.listeners.click) this.listeners.click({ target: this });
  }

  querySelector() {
    return new FakeElement();
  }

  querySelectorAll() {
    return [];
  }
}

function createLocalStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
    dump() {
      return Object.fromEntries(data);
    }
  };
}

function createDocument() {
  const elements = new Map();
  const requiredIds = [
    "agentCount",
    "agentList",
    "taskMetric",
    "logMetric",
    "languageToggle",
    "localOnlyLabel",
    "goalInput",
    "flowView",
    "runProgressView",
    "currentStepMetric",
    "taskBoard",
    "col-planned",
    "col-active",
    "col-review",
    "col-done",
    "col-blocked",
    "col-failed",
    "outputInputs",
    "logView",
    "finalOutput",
    "decomposeBtn",
    "exampleBtn",
    "resetBtn",
    "clearStateBtn",
    "summarizeBtn",
    "copyBtn",
    "exportJsonBtn",
    "importJsonBtn",
    "importJsonInput",
    "runRecordView",
    "promptPreview"
  ];

  for (const id of requiredIds) {
    elements.set(id, new FakeElement(id));
  }
  elements.get("localOnlyLabel").setAttribute("data-i18n", "header.localOnly");

  const documentElement = new FakeElement("html");

  return {
    body: new FakeElement("body"),
    documentElement,
    createElement() {
      return new FakeElement();
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    querySelectorAll(selector) {
      const match = selector.match(/^\[([^\]]+)\]$/);
      if (!match) return [];
      return [...elements.values()].filter(element => element.getAttribute(match[1]) !== null);
    }
  };
}

function loadRuntime(options = {}) {
  const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => script.trim());
  assert.strictEqual(scripts.length, 1, "index.html should keep one inline runtime script");

  const clipboard = { value: "" };
  const storage = options.localStorage || createLocalStorage();
  const context = {
    console: options.console || console,
    document: createDocument(),
    localStorage: storage,
    navigator: {
      clipboard: {
        writeText(text) {
          clipboard.value = text;
          return Promise.resolve();
        }
      }
    },
    Blob: class FakeBlob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    },
    URL: {
      createObjectURL() {
        return "blob:agentflow-test";
      },
      revokeObjectURL() {}
    },
    FileReader: class FakeFileReader {},
    confirm() {
      return true;
    },
    mermaid: {
      initialize() {},
      run() {}
    },
    setTimeout,
    clearTimeout
  };
  context.window = context;
  vm.runInNewContext(scripts[0], context, { filename: "index.html" });
  return { context, clipboard };
}

function testRuntimeStateAndPersistence() {
  const { context } = loadRuntime();

  assert.ok(context.window.AgentFlowState, "window.AgentFlowState should exist");
  assert.strictEqual(context.window.AgentFlowState.version, "0.2.1");
  assert.match(context.window.AgentFlowState.runId, /^run_/);
  assert.ok(context.window.AgentFlowRuntime, "AgentFlowRuntime should expose testable runtime actions");

  context.document.getElementById("goalInput").value = "Build a local runtime for AgentFlow";
  context.window.AgentFlowRuntime.decompose();

  assert.ok(context.window.AgentFlowState.tasks.length > 0, "decompose should create tasks");
  assert.strictEqual(
    context.window.AgentFlowState.workflow.length,
    context.window.AgentFlowState.tasks.length,
    "workflow should mirror decomposed tasks"
  );
  assert.ok(context.localStorage.getItem("agentflow:v0.2:state"), "state should auto-save to localStorage");
}

function testTaskStateMachinePromptAndRunner() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Ship AgentFlow v0.2 Local Runtime";
  runtime.decompose();

  const firstTask = context.window.AgentFlowState.tasks[0];
  const prompt = runtime.generateAgentPrompt(firstTask.id);
  assert.ok(prompt.includes("You are Commander"), "prompt should include agent identity");
  assert.ok(prompt.includes("Project:\nAgentFlow Studio"), "prompt should include project context");
  assert.ok(prompt.includes("Ship AgentFlow v0.2 Local Runtime"), "prompt should include user goal");
  assert.ok(prompt.includes("Return format:"), "prompt should include structured return format");

  runtime.runStep(firstTask.id);
  assert.strictEqual(context.window.AgentFlowState.currentStepId, firstTask.id);
  assert.strictEqual(context.window.AgentFlowState.tasks[0].status, "active");

  runtime.submitStepOutput(firstTask.id, "Summary\nMain Output\nIssues\nNext Steps", "done");
  assert.strictEqual(context.window.AgentFlowState.tasks[0].status, "done");
  assert.ok(context.window.AgentFlowState.tasks[0].output.includes("Main Output"));
  assert.notStrictEqual(context.window.AgentFlowState.currentStepId, firstTask.id);
}

function testRunRecordImportExportReplay() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Create replayable run records";
  runtime.decompose();
  runtime.submitStepOutput(context.window.AgentFlowState.tasks[0].id, "Recorded output");

  const record = runtime.createRunRecord();
  assert.strictEqual(record.version, "0.2.1");
  assert.ok(record.runId);
  assert.ok(Array.isArray(record.outputs));
  assert.ok(record.outputs.length > 0);

  runtime.clearLocalState();
  assert.strictEqual(context.window.AgentFlowState.tasks.length, 0);

  runtime.importRunRecord(record);
  assert.strictEqual(context.window.AgentFlowState.runId, record.runId);
  assert.strictEqual(context.window.AgentFlowState.tasks.length, record.tasks.length);
  assert.strictEqual(context.document.getElementById("goalInput").value, "Create replayable run records");
}

function testRoadmapNamesLocalRuntime() {
  const roadmap = fs.readFileSync(path.join(repoRoot, "ROADMAP.md"), "utf8");
  assert.ok(roadmap.includes("## v0.2.0 — Local Runtime"), "ROADMAP should name v0.2 Local Runtime");
  const v02 = roadmap.split("## v0.3.0")[0];
  assert.ok(v02.includes("LocalStorage persistence"));
  assert.ok(!v02.includes("SQLite"), "SQLite must not be part of v0.2");
  assert.ok(!v02.includes("FastAPI"), "FastAPI must not be part of v0.2");
}

function testCurrentStepNullSurvivesCompletedRunImport() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Replay a completed dependency-aware run";
  runtime.decompose();

  const record = runtime.createRunRecord();
  record.tasks = record.tasks.map(task => ({ ...task, status: "done" }));
  record.workflow = record.workflow.map(step => ({ ...step, status: "done" }));
  record.currentStepId = null;

  assert.strictEqual(runtime.importRunRecord(record), true);
  assert.strictEqual(
    context.window.AgentFlowState.currentStepId,
    null,
    "completed imports should preserve explicit null currentStepId"
  );
}

function testDependencyRollbackRecomputesCurrentStep() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Rollback upstream frontend dependency";
  runtime.decompose();
  runtime.submitStepOutput("analyze", "analysis output", "done");
  runtime.submitStepOutput("plan", "plan output", "done");

  assert.strictEqual(context.window.AgentFlowState.currentStepId, "implement");
  assert.strictEqual(runtime.canRunStep("implement"), true);

  runtime.changeTaskStatus("plan", "planned");

  assert.strictEqual(runtime.canRunStep("implement"), false);
  assert.notStrictEqual(
    context.window.AgentFlowState.currentStepId,
    "implement",
    "currentStepId should move away from a step whose dependencies are no longer complete"
  );
}

function testDependencyRollbackInvalidatesDownstreamTasks() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Invalidate stale downstream frontend work";
  runtime.decompose();
  ["analyze", "plan", "implement", "polish", "package", "review"].forEach(taskId => {
    runtime.submitStepOutput(taskId, `${taskId} output`, "done");
  });

  assert.strictEqual(context.window.AgentFlowState.currentStepId, "test");

  runtime.changeTaskStatus("implement", "planned");

  const tasks = Object.fromEntries(context.window.AgentFlowState.tasks.map(task => [task.id, task]));
  assert.strictEqual(tasks.review.status, "planned");
  assert.strictEqual(tasks.test.status, "planned");
  assert.strictEqual(
    context.window.AgentFlowState.currentStepId,
    "implement",
    "currentStepId should return to the reopened upstream task"
  );
  assert.strictEqual(runtime.canRunStep("test"), false);
}

function testPresetSelectionByGoalKeywords() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Build a cyberpunk website with a 3d UI";
  runtime.decompose();
  assert.strictEqual(context.window.AgentFlowState.tasks.length, 8, "frontend-flavored goals should use the 8-step preset");
  assert.ok(context.window.AgentFlowState.tasks.some(task => task.id === "polish"), "frontend preset includes the UI polish step");

  context.document.getElementById("goalInput").value = "Write a market research report";
  runtime.decompose();
  assert.strictEqual(context.window.AgentFlowState.tasks.length, 6, "generic goals should use the 6-step preset");
}

function testLogHistoryIsCapped() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Cap the collaboration log history";
  runtime.decompose();
  const taskId = context.window.AgentFlowState.tasks[0].id;
  for (let i = 0; i < 130; i++) {
    runtime.changeTaskStatus(taskId, "review");
    runtime.changeTaskStatus(taskId, "planned");
  }
  assert.strictEqual(context.window.AgentFlowState.logs.length, 200, "log history should be capped at 200 entries");

  const record = runtime.createRunRecord();
  assert.ok(record.logs.length <= 200, "exported run records should keep the capped log history");
}

function testRestoredOversizedLogHistoryIsTruncated() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  context.document.getElementById("goalInput").value = "Truncate oversized restored logs";
  runtime.decompose();
  const stored = JSON.parse(context.localStorage.getItem("agentflow:v0.2:state"));
  stored.logs = Array.from({ length: 250 }, (_, i) => ({
    time: stored.updatedAt,
    actor: "System",
    action: "bulk.entry",
    message: "entry " + i,
    data: {}
  }));
  context.localStorage.setItem("agentflow:v0.2:state", JSON.stringify(stored));

  const restored = runtime.loadState();
  assert.strictEqual(restored.logs.length, 200, "restored log histories must be truncated to the cap before any new log is written");
}

function testImportRejectsInvalidDependencyGraphs() {
  const { context } = loadRuntime();
  const runtime = context.window.AgentFlowRuntime;

  const cyclic = {
    tasks: [
      { id: "a", title: "A", agent: "commander", status: "planned", dependsOn: ["b"] },
      { id: "b", title: "B", agent: "coder", status: "planned", dependsOn: ["a"] }
    ]
  };
  let result = runtime.validateRunRecord(cyclic);
  assert.strictEqual(result.valid, false, "cyclic dependency graphs must fail validation");
  assert.ok(result.errors.some(error => error.includes("cycle")), "cycle errors should name the cycle");

  const duplicate = {
    tasks: [
      { id: "a", title: "A", agent: "commander", status: "planned" },
      { id: "a", title: "A again", agent: "coder", status: "planned" }
    ]
  };
  result = runtime.validateRunRecord(duplicate);
  assert.strictEqual(result.valid, false, "duplicate task ids must fail validation");
  assert.ok(result.errors.some(error => error.includes("duplicate")));

  const unknownDependency = {
    tasks: [{ id: "a", title: "A", agent: "commander", status: "planned", dependsOn: ["ghost"] }]
  };
  result = runtime.validateRunRecord(unknownDependency);
  assert.strictEqual(result.valid, false, "unknown dependency references must fail validation");
  assert.ok(result.errors.some(error => error.includes("unknown task")));

  context.document.getElementById("goalInput").value = "Keep current state when an import is rejected";
  runtime.decompose();
  const taskCountBefore = context.window.AgentFlowState.tasks.length;
  assert.strictEqual(runtime.importRunRecord(cyclic), false, "importRunRecord should reject invalid records");
  assert.strictEqual(context.window.AgentFlowState.tasks.length, taskCountBefore, "rejected imports must preserve current state");
}

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

function testLanguagePreferenceFallbacks() {
  const invalidStorage = createLocalStorage();
  invalidStorage.setItem("agentflow:ui-language", "fr");
  const invalidContext = loadRuntime({ localStorage: invalidStorage }).context;
  assert.strictEqual(invalidContext.window.AgentFlowI18n.getLanguage(), "en");

  const blockedStorage = createLocalStorage();
  blockedStorage.setItem = () => { throw new Error("storage blocked"); };
  const blockedContext = loadRuntime({
    localStorage: blockedStorage,
    console: { log() {}, warn() {}, error() {} }
  }).context;
  assert.doesNotThrow(() => blockedContext.window.AgentFlowI18n.setLanguage("zh-CN"));
  assert.strictEqual(blockedContext.window.AgentFlowI18n.getLanguage(), "zh-CN");
}

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

testRuntimeStateAndPersistence();
testTaskStateMachinePromptAndRunner();
testRunRecordImportExportReplay();
testRoadmapNamesLocalRuntime();
testCurrentStepNullSurvivesCompletedRunImport();
testDependencyRollbackRecomputesCurrentStep();
testDependencyRollbackInvalidatesDownstreamTasks();
testPresetSelectionByGoalKeywords();
testLogHistoryIsCapped();
testRestoredOversizedLogHistoryIsTruncated();
testImportRejectsInvalidDependencyGraphs();
testInterfaceLanguageToggleAndPersistence();
testLanguagePreferenceFallbacks();
testDeclaredInterfaceTranslationsResolve();
testDynamicInterfaceCopySwitchesWithoutTranslatingRunData();

console.log("LOCAL_RUNTIME_TESTS_OK");
