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
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  appendChild() {}

  setAttribute(name, value) {
    this[name] = value;
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
    "goalInput",
    "flowView",
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

  return {
    body: new FakeElement("body"),
    createElement() {
      return new FakeElement();
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    }
  };
}

function loadRuntime() {
  const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => script.trim());
  assert.strictEqual(scripts.length, 1, "index.html should keep one inline runtime script");

  const clipboard = { value: "" };
  const context = {
    console,
    document: createDocument(),
    localStorage: createLocalStorage(),
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

testRuntimeStateAndPersistence();
testTaskStateMachinePromptAndRunner();
testRunRecordImportExportReplay();
testRoadmapNamesLocalRuntime();
testCurrentStepNullSurvivesCompletedRunImport();
testDependencyRollbackRecomputesCurrentStep();
testDependencyRollbackInvalidatesDownstreamTasks();

console.log("LOCAL_RUNTIME_TESTS_OK");
