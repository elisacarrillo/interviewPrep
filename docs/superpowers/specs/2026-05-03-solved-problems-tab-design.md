# Solved Problems Tab — Design Spec

**Date:** 2026-05-03  
**Status:** Approved

## Overview

Add a top-level nav bar to the Partiful prep app so users can switch between the Study Plan and a Solved Problems view. Solved problems are loaded automatically from `docs/completed_problems/*.md` files using Vite's `import.meta.glob`.

## Nav Bar

A row of two pill buttons rendered at the very top of `StudyPlan` in `prepdoc.jsx`, above the header and phase tabs:

- **"Study Plan"** — switches to the existing plan view
- **"Solved Problems"** — switches to the new solved view

Active tab: pink accent (`#FF4F9A`) background, white text. Inactive: `#1A1A1E` background, muted `#888` text. Same visual language as the existing phase tabs.

State: extend the existing `view` useState to include a `'solved'` value (currently `'plan'` | `'pattern'`).

## File Loading

At module level in `prepdoc.jsx`, one `import.meta.glob` call:

```js
const rawFiles = import.meta.glob('../docs/completed_problems/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});
```

This returns `{ './path/to/file.md': rawString, ... }`. New `.md` files dropped into `docs/completed_problems/` appear automatically without code changes.

## Markdown Parser

A small function (added inline in `prepdoc.jsx`) that takes a raw markdown string and returns `{ title, language, code }`:

- **title**: text of the first `## Heading` line
- **language**: language hint from the opening fence (` ```python ` → `"python"`), empty string if none
- **code**: the content between the fences

If a file has no h2 or no code block, it falls back gracefully (filename as title, raw content as code).

## Solved Problems View

A new section rendered when `view === 'solved'`. Maps over parsed problems (sorted by filename) and renders each as a card:

- **Card container**: `background: #13131A`, `border: 1px solid #1E1E28`, `borderRadius: 12`, `padding: 20px` — matches existing topic cards
- **Title**: `fontSize: 16`, `fontWeight: 600`, `color: #F0EEF8`, `marginBottom: 12`
- **Language badge** (if present): small pill, `background: #FF4F9A22`, `color: #FF4F9A`, `fontSize: 11` — same style as pattern tags
- **Code block**: `<pre><code>` with `background: #0D0D12`, `borderRadius: 8`, `padding: 16px`, `fontSize: 12`, `color: #CCC`, `overflowX: auto`, `fontFamily: inherit`

If no solved problems exist yet, show a muted empty state: "No solved problems yet."

## Data Flow

```
docs/completed_problems/*.md
        ↓ import.meta.glob (eager, ?raw)
  rawFiles map (path → string)
        ↓ parseSolvedProblem()
  [{ title, language, code }]
        ↓
  SolvedProblems JSX (cards)
```

## Scope

- No routing changes (single-page, view-state only)
- No new dependencies
- No changes to PatternPage or parsePatterns
- No persistence or interactivity on the solved tab (read-only display)
