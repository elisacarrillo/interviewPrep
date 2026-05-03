# Pattern Detail Page — Design Spec
Date: 2026-05-03

## Overview

Clicking any pattern pill in the study plan navigates to a full-screen pattern detail page. The page shows a step-by-step visual diagram of the pattern and an annotated code skeleton. Pattern content lives in a plain markdown file for easy editing. A personal notes section is editable in the UI and persisted to localStorage.

---

## Interaction

- Clicking a pattern pill replaces the study plan view with the pattern detail page (React state swap, no router)
- A **back button** returns to the study plan, restoring the previously active phase
- **Prev / next** arrows in the top-right navigate between all patterns within the phase that was active when the pill was clicked, in order across topics

---

## Pattern Page Layout

### Nav bar (top)
- Left: `← Back to study plan` text button
- Right: `← PrevPatternName` and `NextPatternName →` text links (hidden at first/last)

### Header
- Small label: phase name + topic name (e.g. "Phase 1 · Arrays & Hash Maps")
- Large heading: pattern name, styled with the phase accent color

### Section 1 — "How it moves" (step-by-step diagram)
- 2–4 labeled steps derived from the pattern's `steps` data
- Each step: numbered label + 5-element demo array `[a, b, c, d, e]` with the window range highlighted in the phase accent color
- Elements outside the window are dimmed; dropped elements shown with dashed border

### Section 2 — "Code shape" (annotated skeleton)
- Raw code block from the markdown file, rendered with syntax-like coloring
- Comment lines (`# ...`) styled in a muted color to distinguish from code

### Section 3 — Tip
- The tip string from the pattern's markdown entry, shown with pink left-border callout

### Section 4 — Problems using this pattern
- Derived at runtime by scanning `plan.phases` for problems in topics that list this pattern
- Plain list, no interaction

### Section 5 — Your Notes
- Editable `<textarea>` pre-filled from `localStorage`
- Saves to `localStorage` on every keystroke (debounced ~500ms)
- Key: `pattern-notes-<pattern-name-slug>` (e.g. `pattern-notes-sliding-window`)
- Placeholder: "Add your own notes, mnemonics, or insights..."
- Styled to match the dark theme; no explicit save button needed

---

## Pattern Data — `src/patterns.md`

All pattern content lives in a single markdown file. Vite imports it as a raw string (`import patternsRaw from './patterns.md?raw'`) and a small parser extracts the data at module load time.

### File format

```markdown
# Sliding Window
<!-- phase: 1, topic: Arrays & Hash Maps -->

## Steps
- ① Initialize — left = 0, right = 0 | window: [0,0]
- ② Expand right — constraint still valid | window: [0,2]
- ③ Shrink left — constraint broken | window: [1,3]

## Code
\```
left = 0
for right in range(len(arr)):
    # ① add arr[right] to window
    while window_is_invalid():
        # ③ remove arr[left], left += 1
    # ② record best result
\```

## Tip
Use when the problem asks for the longest/shortest subarray satisfying a condition.

## Problems
- Longest Substring Without Repeating Characters
- Maximum Subarray of Size K

---

# Two Pointers
...
```

### Parser output shape (per pattern)

```js
{
  name: "Sliding Window",
  phase: 1,
  topic: "Arrays & Hash Maps",
  steps: [
    { label: "① Initialize — left = 0, right = 0", window: [0, 0] },
    { label: "② Expand right — constraint still valid", window: [0, 2] },
    { label: "③ Shrink left — constraint broken", window: [1, 3] },
  ],
  code: "left = 0\nfor right in range(len(arr)):\n    ...",
  tip: "Use when the problem asks for...",
  problems: ["Longest Substring Without Repeating Characters", ...]
}
```

The parser splits on `---` to get per-pattern blocks, then extracts each `##` section. It is a simple string parser — no markdown library needed.

---

## `plan` data — pattern strings remain strings

The `patterns` arrays inside `plan.phases[].topics[]` stay as plain strings (e.g. `"Sliding Window"`). The pill click looks up the matching entry in the parsed patterns data by name. This keeps `prepdoc.jsx`'s data section unchanged except for the pill click handler.

---

## State

```js
const [view, setView] = useState('plan')           // 'plan' | 'pattern'
const [activePatternKey, setActivePatternKey] = useState(null)
// { phaseIndex, topicIndex, patternName }
```

- Clicking a pill: set both, switch to `'pattern'` view
- Back: `setView('plan')`
- Prev/next: recompute from flat list of all pattern names in the active phase

---

## Scope

- No routing library — state-based view swap only
- No page transition animations
- The step diagram always uses the fixed demo array `[a, b, c, d, e]`
- Notes are browser-local only (localStorage) — no sync, no export
- Parser handles the exact format above; no need to support arbitrary markdown

## Out of Scope

- Animated step-through (buttons to walk steps one at a time)
- Progress tracking / "understood" marking on patterns
- Syncing notes across devices
