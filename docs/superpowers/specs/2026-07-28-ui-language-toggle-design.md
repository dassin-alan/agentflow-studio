# UI Language Toggle Design

## Summary

Add a compact language toggle to AgentFlow Studio so users can switch the
application interface between English and Simplified Chinese without reloading
the page. English remains the default. The selected language is persisted
locally and restored the next time the application opens.

This is an interface-only localization feature. It must not translate or mutate
workflow data, user content, prompts, logs, outputs, or RunRecords.

## Goals

- Add one visible language control near the existing `Local Only` indicator.
- Switch supported interface copy immediately between English and Chinese.
- Default to English when no language preference has been saved.
- Persist the selected language independently from runtime state.
- Keep layout stable on desktop and narrow mobile viewports.
- Preserve all v0.2.1 runtime behavior and data formats.

## Non-Goals

- Translating user-entered goals or task content.
- Translating imported RunRecords, agent outputs, prompts, or logs.
- Calling an external translation service.
- Adding automatic browser-language detection.
- Adding languages other than English and Simplified Chinese.
- Changing `VERSION`, workflow schemas, agent IDs, or dependency behavior.

## User Experience

The top-right status group gains a compact language button beside `Local Only`.

- In English mode, the button displays `中文`.
- In Chinese mode, the button displays `EN`.
- The button has a globe icon, tooltip, keyboard focus state, and stable width.
- Clicking the button updates the interface immediately without page reload.
- The root document `lang` attribute changes between `en` and `zh-CN`.
- The selected mode is restored on the next visit.

The control remains visible and usable at the existing mobile breakpoint. It
must not cause header badges or text to overlap.

## Localization Boundary

The following interface-owned copy is localized:

- Header metadata and local-only status.
- Hero eyebrow, headline, description, actions, metrics, and process labels.
- Section titles, tabs, empty states, buttons, tooltips, and form placeholders.
- Status labels and dependency readiness explanations.
- Agent role labels and descriptions.
- Progress counters and board column labels.
- Validation and interaction feedback shown by the UI.

The following run-owned content is never translated:

- Goal text entered by the user.
- Task titles, descriptions, and acceptance criteria stored in runtime state.
- Prompt bodies, pasted agent outputs, collaboration logs, and final Markdown.
- Imported or exported RunRecord fields and values.

This boundary prevents a language switch from altering replayable project data.

## Architecture

### Translation Catalog

Add a single in-file `translations` catalog:

```js
const translations = {
  en: { "header.localOnly": "Local Only" },
  "zh-CN": { "header.localOnly": "仅限本地" }
};
```

English keys are the canonical source. A `t(key, params)` helper returns the
active translation, falls back to English, and finally returns the key when a
catalog entry is missing. Parameter replacement is limited to simple named
tokens needed by counters or dependency messages.

### Static Interface Copy

Static elements use `data-i18n`, `data-i18n-placeholder`,
`data-i18n-title`, or `data-i18n-aria-label`. `applyLanguage()` updates only
these declared attributes instead of scanning arbitrary text nodes.

### Dynamic Interface Copy

Render functions call `t()` for interface labels they create. Runtime content
continues to use the original state values. `renderAll()` remains responsible
for normal rendering; the language switch updates the active language, applies
static translations, and invokes `renderAll()` once so dynamic labels follow.

### Preference Storage

Use a dedicated key such as `agentflow:ui-language`. It is separate from
`agentflow:v0.2:state`, so changing language cannot affect RunRecord state.

Accepted stored values are only `en` and `zh-CN`. Missing or invalid values
fall back to `en`.

## Data Flow

1. Page startup reads the saved UI language.
2. The value is normalized to `en` or `zh-CN`.
3. Static interface attributes are translated.
4. Existing runtime state loads and renders normally.
5. A toggle click changes the language, persists it, updates the document
   language, reapplies static copy, and rerenders dynamic interface labels.
6. Runtime state and export data remain byte-for-byte unaffected by the toggle.

## Error Handling

- Missing translation entries fall back to English.
- Invalid stored language values fall back to English.
- A localStorage write failure does not block the immediate language switch.
- Translation helpers never throw because of absent parameters or DOM nodes.

## Accessibility

- Use a real `<button type="button">`.
- Keep a visible keyboard focus treatment consistent with current controls.
- Update `aria-label` and `title` to describe the action in the active language.
- Use text plus a familiar globe icon rather than an icon-only control.
- Keep the button width stable so language changes do not shift the header.

## Testing

Automated tests must prove:

- English is the default with no preference.
- Clicking the control switches representative static and dynamic labels.
- Clicking again restores English.
- `zh-CN` preference survives reload.
- Invalid stored values fall back to English.
- `document.documentElement.lang` follows the selected language.
- Runtime task state and RunRecord content remain unchanged across toggles.
- Existing dependency-aware runtime tests continue to pass.

Browser acceptance must cover desktop and `390x844` mobile viewports, including
header fit, keyboard activation, persistence after reload, and absence of
uncaught page errors.

## Delivery

Development occurs on `feature/v0.2.2-ui-language-toggle` in an isolated
worktree. The implementation stays within the existing single-file,
Vanilla JavaScript architecture. `VERSION`, tags, remote branches, and v0.3
protocol work remain unchanged unless separately approved.
