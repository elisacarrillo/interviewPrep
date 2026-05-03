# Solved Problems Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-level nav bar to the prep app so users can switch between Study Plan and a Solved Problems view that auto-loads and displays all markdown files from `docs/completed_problems/`.

**Architecture:** Extend `view` state in `prepdoc.jsx` to include `'solved'`, add a nav bar at the top of the main return, and load problem files via `import.meta.glob`. Add a `parseSolvedProblem` function to `parsePatterns.js` to extract title, language, and code from each markdown file.

**Tech Stack:** React 19, Vite 8, Vitest 4

---

## File Map

- **Modify:** `src/parsePatterns.js` — export new `parseSolvedProblem(raw)` function
- **Modify:** `src/parsePatterns.test.js` — add tests for `parseSolvedProblem`
- **Modify:** `src/prepdoc.jsx` — add glob import, extend view state, add nav bar, add solved view

---

### Task 1: Add `parseSolvedProblem` to parsePatterns.js (TDD)

**Files:**
- Modify: `src/parsePatterns.test.js`
- Modify: `src/parsePatterns.js`

- [ ] **Step 1: Write failing tests**

Add to the bottom of `src/parsePatterns.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parsePatterns, slugify, parseSolvedProblem } from './parsePatterns';

// ... existing tests unchanged above ...

describe('parseSolvedProblem', () => {
  it('extracts title from h2', () => {
    const raw = '## Two Sum\n\n```python\nreturn []\n```';
    expect(parseSolvedProblem(raw).title).toBe('Two Sum');
  });

  it('extracts language from code fence', () => {
    const raw = '## Two Sum\n\n```python\nreturn []\n```';
    expect(parseSolvedProblem(raw).language).toBe('python');
  });

  it('extracts code content without the fence', () => {
    const raw = '## Two Sum\n\n```python\nreturn []\n```';
    expect(parseSolvedProblem(raw).code).toBe('return []');
  });

  it('returns empty string for language when fence has no tag', () => {
    const raw = '## Foo\n\n```\nsome code\n```';
    expect(parseSolvedProblem(raw).language).toBe('');
  });

  it('falls back to "Untitled" when no h2 present', () => {
    const raw = '```python\npass\n```';
    expect(parseSolvedProblem(raw).title).toBe('Untitled');
  });

  it('falls back to raw content when no code fence present', () => {
    const raw = '## Foo\n\njust prose';
    const result = parseSolvedProblem(raw);
    expect(result.code).toBe('## Foo\n\njust prose'.trim());
    expect(result.language).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `parseSolvedProblem is not a function` (or similar import error)

- [ ] **Step 3: Implement `parseSolvedProblem` in `src/parsePatterns.js`**

Add this export at the bottom of `src/parsePatterns.js`:

```js
export function parseSolvedProblem(raw) {
  const titleMatch = raw.match(/^##\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  const codeMatch = raw.match(/```(\w*)\n([\s\S]*?)```/);
  const language = codeMatch ? codeMatch[1] : '';
  const code = codeMatch ? codeMatch[2].trim() : raw.trim();

  return { title, language, code };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS including the new `parseSolvedProblem` suite

- [ ] **Step 5: Commit**

```bash
git add src/parsePatterns.js src/parsePatterns.test.js
git commit -m "feat: add parseSolvedProblem to parsePatterns"
```

---

### Task 2: Add glob import and solved view to prepdoc.jsx

**Files:**
- Modify: `src/prepdoc.jsx`

- [ ] **Step 1: Add the glob import and parsed problems at the top of `src/prepdoc.jsx`**

Add these two lines directly below the existing imports (after the `patternsRaw` import line, before the `parsedPatterns` line):

```js
import { parseSolvedProblem } from './parsePatterns';

const rawFiles = import.meta.glob('../docs/completed_problems/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const solvedProblems = Object.entries(rawFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, raw]) => parseSolvedProblem(raw));
```

The full import block at the top of the file should now look like:

```js
import { useState } from "react";
import PatternPage from "./PatternPage";
import { parsePatterns, parseSolvedProblem } from "./parsePatterns";
import patternsRaw from "./patterns.md?raw";

const parsedPatterns = parsePatterns(patternsRaw);

const rawFiles = import.meta.glob('../docs/completed_problems/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const solvedProblems = Object.entries(rawFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, raw]) => parseSolvedProblem(raw));
```

- [ ] **Step 2: Add the top-level nav bar to the main return**

In the main `return (...)` in `StudyPlan`, add the nav bar as the very first element inside the outer `<div>` (before the `{/* Header */}` comment block):

```jsx
{/* Top-level nav */}
<div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
  {[
    { key: 'plan', label: 'Study Plan' },
    { key: 'solved', label: 'Solved Problems' },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setView(key)}
      style={{
        background: view === key ? '#FF4F9A' : '#1A1A1E',
        color: view === key ? '#fff' : '#888',
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Add the solved view and wrap the plan content**

Immediately after the nav bar, wrap all existing plan content (header through the Partiful tips button) in a conditional, and add the solved view alternative. The structure inside the outer `<div>` should become:

```jsx
{/* Top-level nav */}
{/* ... nav bar from step 2 ... */}

{view === 'solved' ? (
  /* Solved Problems view */
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {solvedProblems.length === 0 ? (
      <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 40 }}>
        No solved problems yet.
      </div>
    ) : (
      solvedProblems.map(({ title, language, code }, i) => (
        <div key={i} style={{ background: '#13131A', borderRadius: 12, padding: '20px', border: '1px solid #1E1E28' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#F0EEF8' }}>{title}</span>
            {language && (
              <span style={{
                background: '#FF4F9A22',
                color: '#FF4F9A',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
                border: '1px solid #FF4F9A33',
              }}>{language}</span>
            )}
          </div>
          <pre style={{
            background: '#0D0D12',
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            color: '#CCC',
            overflowX: 'auto',
            fontFamily: 'inherit',
            margin: 0,
          }}>
            <code>{code}</code>
          </pre>
        </div>
      ))
    )}
  </div>
) : (
  /* Study Plan view — all existing content unchanged */
  <>
    {/* Header */}
    {/* ... existing header JSX ... */}

    {/* Phase tabs */}
    {/* ... existing phase tab JSX ... */}

    {/* Phase card */}
    {/* ... existing phase card JSX ... */}

    {/* Topics */}
    {/* ... existing topics JSX ... */}

    {/* Partiful-specific tips */}
    {/* ... existing tips JSX ... */}
  </>
)}
```

Wrap all the existing plan content (lines 185–338 of the current file) inside the `<> ... </>` fragment above. Do not change the existing content — just move it inside the fragment.

- [ ] **Step 4: Start dev server and verify in browser**

Run: `npm run dev`

Check:
1. "Study Plan" and "Solved Problems" appear as pill buttons at the top
2. Clicking "Solved Problems" shows the Two Sum card with title, `sh` language badge, and code block
3. Clicking "Study Plan" returns to the existing plan view
4. Existing plan functionality (phase tabs, checkboxes, pattern links) still works

- [ ] **Step 5: Commit**

```bash
git add src/prepdoc.jsx
git commit -m "feat: add solved problems tab with top-level nav"
```
