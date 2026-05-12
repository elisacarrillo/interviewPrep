# Problem Tracker Redesign
_Date: 2026-05-11_

## Overview

Rebuild the app from a Partiful-specific study plan into a general-purpose NeetCode 150 problem tracker focused on learnings, AI-powered solution review, difficulty self-assessment, and daily reinforcement of hard problems.

The Study Plan tab is removed entirely. The app becomes a personal problem-solving journal with intelligence layered on top.

---

## 1. Data Model

Each solved problem lives as a markdown file in `docs/completed_problems/<slug>.md` with YAML frontmatter:

```md
---
difficulty: 4
date: 2026-05-11
notes: "Struggled with the two-pointer approach at first"
learnings: "Always sort when two pointers need a predictable order"
timeComplexity: "O(n log n)"
spaceComplexity: "O(1)"
comparison: { problem: "Contains Duplicate", result: "harder" }
aiReview: "Your solution is O(n log n) due to the sort. A hash set approach achieves O(n)..."
aiScore: 6
---

## Two Sum

```python
def twoSum(self, nums, target):
    ...
```
```

### Frontmatter fields

| Field | Type | Description |
|-------|------|-------------|
| `difficulty` | `1–5` | User's perceived difficulty rating |
| `date` | `YYYY-MM-DD` | Date solved |
| `notes` | string | Freeform thoughts while solving |
| `learnings` | string | Key takeaway to remember |
| `timeComplexity` | string | User's stated time complexity (e.g. `O(n)`) |
| `spaceComplexity` | string | User's stated space complexity |
| `comparison` | object | `{ problem: string, result: "harder" \| "easier" }` — only present if a same-category problem was solved the same day |
| `aiReview` | string | Claude's written feedback, stored on save |
| `aiScore` | `1–10` | Claude's quality score for the solution |

### Existing solved files

The 21 existing `docs/completed_problems/*.md` files have no frontmatter. The backend treats missing frontmatter as solved with no metadata — they appear as solved in the Problems list with no difficulty dot, and their code is shown without notes, rating, or AI review. The user can open the modal and save an updated version to add metadata.

### NeetCode 150 problem list

A hardcoded `src/problems.js` array of 150 objects:

```js
{
  id: "two-sum",
  title: "Two Sum",
  category: "Arrays & Hashing",
  lcDifficulty: "Easy",
  leetcodeUrl: "https://leetcode.com/problems/two-sum/"
}
```

Categories: Arrays & Hashing, Two Pointers, Sliding Window, Stack, Binary Search, Linked List, Trees, Tries, Heap / Priority Queue, Backtracking, Graphs, Advanced Graphs, 1-D Dynamic Programming, 2-D Dynamic Programming, Greedy, Intervals, Math & Geometry, Bit Manipulation.

---

## 2. Backend (Express)

A small Express server at `server/index.js` runs alongside Vite in dev and standalone in production. Uses `gray-matter` for frontmatter parsing and `@anthropic-ai/sdk` for Claude calls. API key in `.env` as `ANTHROPIC_API_KEY`.

### File structure

```
server/
  index.js
  routes/
    solutions.js     — CRUD for solution markdown files
    potd.js          — Problem of the Day selection
    weakAreas.js     — Category scoring and suggestions
  lib/
    parseSolution.js — gray-matter read/write helpers
    scoring.js       — weak area scoring logic
```

### API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/problems` | All 150 problems with `solved` flag and frontmatter if solved |
| `GET` | `/api/solutions/:slug` | Full solution data for one problem |
| `POST` | `/api/solutions/:slug` | Save solution → trigger Claude review → write frontmatter → return `{ solution, comparisonPrompt }` where `comparisonPrompt` is `{ problem: string } \| null` |
| `PATCH` | `/api/solutions/:slug` | Save comparison answer only — does not re-run Claude review |
| `GET` | `/api/potd` | Today's Problem of the Day |
| `GET` | `/api/weak-areas` | Flagged categories with extra problem suggestions |

### POTD logic

- Pool: all solved problems with `difficulty >= 4`
- Selection: `pool[dayOfYear % pool.length]` — deterministic, rotates at midnight
- Fallback: if pool is empty, return a random unsolved problem

### Weak area scoring

Per NeetCode category:

1. **Base score** = average `difficulty` rating across solved problems in that category
2. **Comparison adjustment** = for each stored `comparison` in that category: `"harder"` → +0.2, `"easier"` → -0.1
3. **Weighted score** = `baseScore + comparisonAdjustment`
4. Flag as weak area if weighted score ≥ 3.5

Each flagged category gets a hardcoded list of 3–5 extra LeetCode problems to surface as suggestions.

---

## 3. Frontend

### Navigation

Two top-level tabs replacing the current three:

- **Today** — shown on load
- **Problems** — NeetCode 150 list

The existing pattern detail view (`PatternPage.jsx`) is removed. `prepdoc.jsx` is rewritten.

### Today tab

Two sections:

1. **Problem of the Day** — card showing the selected hard problem: title, your previous solution, notes, learnings, and AI review. Includes a "re-solve" button that opens the solution modal.
2. **Weak Areas** (only shown if any categories are flagged) — list of struggling categories, each with 3–5 suggested extra problems linking to LeetCode.

### Problems tab

All 150 NeetCode problems grouped by category. Each row shows:
- Problem title
- LC difficulty badge (Easy / Medium / Hard)
- Solved indicator: a colored difficulty dot (1–5) if solved, empty circle if not

Clicking any problem opens the **problem modal**.

### Problem modal

**If unsolved:**
- Problem title + LeetCode link
- Language selector
- Code textarea
- Difficulty slider (1–5)
- Notes field
- Learnings field
- Time complexity field ("What do you think the time complexity is?")
- Space complexity field ("What do you think the space complexity is?")
- Save button — triggers `POST /api/solutions/:slug`, shows loading state while Claude review runs, then displays result in the same modal

**If solved:**
- Syntax-highlighted code
- Difficulty rating, notes, learnings
- Your stated time/space complexity
- Comparison context (if present)
- Claude's review text + score
- Edit button to reopen the form with existing values

---

## 4. Claude API Integration

Triggered inside `POST /api/solutions/:slug` after writing the solution to disk.

### Prompt structure

```
You are reviewing a coding interview solution.

Problem: {title} ({category}, LC {lcDifficulty})

User's solution:
{code}

User's complexity analysis:
- Time: {timeComplexity}
- Space: {spaceComplexity}

Return JSON with exactly two fields:
- "review": A direct, specific code review (3–5 sentences). Cover: correctness, actual time and space complexity, whether the user's complexity analysis is correct or where it went wrong, and one concrete improvement suggestion.
- "score": An integer 1–10 rating of solution quality. 10 = optimal, clean, idiomatic. 1 = incorrect or brute force with no structure. Factor in correctness, efficiency, and code clarity.
```

### Response handling

Claude returns `{ review: string, score: number }`. Both fields are written into the markdown frontmatter (`aiReview`, `aiScore`) and returned in the API response. The modal exits its loading state and renders the review inline.

---

## 5. Comparison prompt logic

### Flow

1. `POST /api/solutions/:slug` saves the solution and runs Claude review. The backend checks all solved problems in the same NeetCode category for a `date` matching today (`YYYY-MM-DD`). It returns `comparisonPrompt: { problem: "X" }` if one is found, or `comparisonPrompt: null` if not.
2. If `comparisonPrompt` is non-null, the modal shows inline: "Was this harder or easier than **X**?" with two buttons.
3. The user's answer triggers `PATCH /api/solutions/:slug` with `{ comparison: { problem: "X", result: "harder" | "easier" } }`, which writes only the comparison field to frontmatter without re-running Claude.

The comparison prompt is skipped entirely if no same-category problem was solved today.

---

## Out of scope

- Authentication (single-user personal tool)
- Cloud sync (localStorage / local files only)
- The existing `PatternPage` and Study Plan phase UI
- Editing the NeetCode 150 list in-app
