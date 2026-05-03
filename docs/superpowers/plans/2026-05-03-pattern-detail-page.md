# Pattern Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make pattern pills clickable — each opens a full-screen page with a step-by-step diagram, annotated code skeleton, tip, related problems, and a persistent notes textarea.

**Architecture:** State-based view swap in `StudyPlan` (`view: 'plan' | 'pattern'`). Pattern content lives in `src/patterns.md`, imported via Vite's `?raw` suffix and parsed by a pure function at module load time. Notes are saved to `localStorage` keyed by pattern name slug.

**Tech Stack:** React 19, Vite 8, localStorage, Vitest (added in Task 1)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/parsePatterns.js` | Create | Parse `patterns.md` raw string → array of pattern objects |
| `src/parsePatterns.test.js` | Create | Unit tests for parser |
| `src/patterns.md` | Create | All pattern content (steps, code, tip, problems) |
| `src/PatternPage.jsx` | Create | Full-screen pattern detail component |
| `src/prepdoc.jsx` | Modify | Add view state, pill click handlers, render PatternPage |
| `package.json` | Modify | Add vitest |
| `vite.config.js` | Modify | Add vitest config |

---

## Task 1: Add Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Install vitest**

```bash
cd /Users/queenellie/partifulprep/partiful-app && npm install -D vitest
```

Expected: vitest appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Add test script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Add vitest config to `vite.config.js`**

Read `vite.config.js` first, then add the `test` block:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify vitest works**

```bash
cd /Users/queenellie/partifulprep/partiful-app && npm test
```

Expected: "No test files found" or similar — no errors.

---

## Task 2: Create `src/parsePatterns.js` with tests

**Files:**
- Create: `src/parsePatterns.js`
- Create: `src/parsePatterns.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/parsePatterns.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parsePatterns, slugify } from './parsePatterns';

const SAMPLE = `# Sliding Window
<!-- phase: 1, topic: Arrays & Hash Maps -->

## Steps
- ① Initialize — left=0, right=0 | window: [0,0]
- ② Expand right | window: [0,2]
- ③ Shrink left | window: [1,3]

## Code
\`\`\`
left = 0
for right in range(len(arr)):
    # add to window
\`\`\`

## Tip
Use for subarray problems.

## Problems
- Longest Substring
- Max Subarray`;

const NO_WINDOW = `# Clarify constraints first
<!-- phase: 3, topic: Mock Interview Reps -->

## Steps
- ① Ask about input size and type
- ② Ask about edge cases

## Code
\`\`\`
# Ask questions
\`\`\`

## Tip
Ask before coding.

## Problems
- Apply to every problem`;

describe('parsePatterns', () => {
  it('parses name', () => {
    const [p] = parsePatterns(SAMPLE);
    expect(p.name).toBe('Sliding Window');
  });

  it('parses phase and topic', () => {
    const [p] = parsePatterns(SAMPLE);
    expect(p.phase).toBe(1);
    expect(p.topic).toBe('Arrays & Hash Maps');
  });

  it('parses steps with window indices', () => {
    const [p] = parsePatterns(SAMPLE);
    expect(p.steps).toHaveLength(3);
    expect(p.steps[0]).toEqual({ label: '① Initialize — left=0, right=0', window: [0, 0] });
    expect(p.steps[1]).toEqual({ label: '② Expand right', window: [0, 2] });
  });

  it('parses steps without window as null', () => {
    const [p] = parsePatterns(NO_WINDOW);
    expect(p.steps[0].window).toBeNull();
    expect(p.steps[0].label).toBe('① Ask about input size and type');
  });

  it('parses code block', () => {
    const [p] = parsePatterns(SAMPLE);
    expect(p.code).toContain('for right in range');
  });

  it('parses tip', () => {
    const [p] = parsePatterns(SAMPLE);
    expect(p.tip).toBe('Use for subarray problems.');
  });

  it('parses problems list', () => {
    const [p] = parsePatterns(SAMPLE);
    expect(p.problems).toEqual(['Longest Substring', 'Max Subarray']);
  });

  it('parses multiple patterns split by ---', () => {
    const raw = SAMPLE + '\n\n---\n\n' + NO_WINDOW;
    const patterns = parsePatterns(raw);
    expect(patterns).toHaveLength(2);
    expect(patterns[0].name).toBe('Sliding Window');
    expect(patterns[1].name).toBe('Clarify constraints first');
  });
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Sliding Window')).toBe('sliding-window');
  });
  it('strips parentheses and special chars', () => {
    expect(slugify('DFS (recursive)')).toBe('dfs-recursive');
  });
  it('handles arrow symbols', () => {
    expect(slugify('Brute force → optimize')).toBe('brute-force-optimize');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/queenellie/partifulprep/partiful-app && npm test
```

Expected: FAIL — `parsePatterns` and `slugify` are not defined.

- [ ] **Step 3: Implement `src/parsePatterns.js`**

```js
export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractSection(block, heading) {
  const re = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const m = block.match(re);
  return m ? m[1] : '';
}

function parseBlock(block) {
  const lines = block.split('\n');

  const nameLine = lines.find(l => l.startsWith('# '));
  if (!nameLine) return null;
  const name = nameLine.slice(2).trim();

  const metaLine = lines.find(l => l.includes('phase:'));
  let phase = null, topic = null;
  if (metaLine) {
    const phaseMatch = metaLine.match(/phase:\s*(\d+)/);
    const topicMatch = metaLine.match(/topic:\s*([^-\->]+?)(?:\s*-->)/);
    if (phaseMatch) phase = parseInt(phaseMatch[1]);
    if (topicMatch) topic = topicMatch[1].trim();
  }

  const stepsSection = extractSection(block, 'Steps');
  const steps = stepsSection
    .split('\n')
    .filter(l => l.startsWith('- '))
    .map(l => {
      const text = l.slice(2).trim();
      const pipeIdx = text.indexOf('|');
      const label = pipeIdx >= 0 ? text.slice(0, pipeIdx).trim() : text;
      let window = null;
      if (pipeIdx >= 0) {
        const m = text.slice(pipeIdx).match(/window:\s*\[(\d+),(\d+)\]/);
        if (m) window = [parseInt(m[1]), parseInt(m[2])];
      }
      return { label, window };
    });

  const codeSection = extractSection(block, 'Code');
  const codeMatch = codeSection.match(/```[^\n]*\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trimEnd() : '';

  const tip = extractSection(block, 'Tip').trim();

  const problemsSection = extractSection(block, 'Problems');
  const problems = problemsSection
    .split('\n')
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim());

  return { name, phase, topic, steps, code, tip, problems };
}

export function parsePatterns(raw) {
  return raw
    .split(/\n---\n/)
    .map(b => b.trim())
    .filter(Boolean)
    .map(parseBlock)
    .filter(Boolean);
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd /Users/queenellie/partifulprep/partiful-app && npm test
```

Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/queenellie/partifulprep/partiful-app && git init && git add src/parsePatterns.js src/parsePatterns.test.js package.json vite.config.js package-lock.json && git commit -m "feat: add pattern markdown parser with tests"
```

---

## Task 3: Create `src/patterns.md`

**Files:**
- Create: `src/patterns.md`

- [ ] **Step 1: Create the file with all 28 patterns**

```markdown
# Two Pointers
<!-- phase: 1, topic: Arrays & Hash Maps -->

## Steps
- ① Place left=0, right=n-1 at opposite ends | window: [0,4]
- ② Sum too small — move left right | window: [1,4]
- ③ Sum too large — move right left | window: [1,3]
- ④ Pointers meet — search complete | window: [2,2]

## Code
```
left, right = 0, len(arr) - 1
while left < right:
    total = arr[left] + arr[right]
    if total == target:
        return [left, right]
    elif total < target:
        left += 1   # need larger sum
    else:
        right -= 1  # need smaller sum
```

## Tip
Use when the array is sorted and you need a pair meeting a condition. O(n) instead of O(n²) brute force.

## Problems
- Two Sum
- Container With Most Water
- 3Sum

---

# Sliding Window
<!-- phase: 1, topic: Arrays & Hash Maps -->

## Steps
- ① Initialize left=0, right starts expanding | window: [0,0]
- ② Window grows while constraint holds | window: [0,2]
- ③ Constraint breaks — shrink from left | window: [1,3]
- ④ Continue expanding right | window: [1,4]

## Code
```
left = 0
for right in range(len(arr)):
    # ① add arr[right] to window
    while window_is_invalid():
        # ③ remove arr[left]
        left += 1
    # ② record best window
```

## Tip
Use for longest/shortest subarray problems with a constraint. The window only shrinks from the left — never reset.

## Problems
- Longest Substring Without Repeating Characters
- Minimum Window Substring
- Maximum Sum Subarray of Size K

---

# Frequency Count
<!-- phase: 1, topic: Arrays & Hash Maps -->

## Steps
- ① Pass 1: build frequency map from all elements | window: [0,4]
- ② Pass 2: query the map for the condition | window: [0,2]
- ③ Return result based on counts | window: [0,0]

## Code
```
freq = {}
for x in arr:
    freq[x] = freq.get(x, 0) + 1

# query the map
for x, count in freq.items():
    if condition(count):
        return x
```

## Tip
Anytime you see "find duplicate", "count occurrences", or "check anagram" — build a frequency map first. O(1) lookup pays for itself immediately.

## Problems
- Contains Duplicate
- Valid Anagram
- Top K Frequent Elements

---

# Monotonic Stack
<!-- phase: 1, topic: Stacks & Queues -->

## Steps
- ① Push a — stack: [a] | window: [0,0]
- ② Push b — stack: [a,b] | window: [0,1]
- ③ c > b: pop b (found answer for b), pop a, push c | window: [2,2]
- ④ Push d — stack: [c,d] | window: [2,3]

## Code
```
stack = []
for i, val in enumerate(arr):
    while stack and arr[stack[-1]] < val:
        idx = stack.pop()
        # arr[i] is the "next greater" for arr[idx]
    stack.append(i)
# remaining stack elements have no next greater
```

## Tip
The stack stays sorted (monotone). When you push, pop everything smaller — that pop moment is when you record the answer for each popped element.

## Problems
- Daily Temperatures
- Largest Rectangle in Histogram
- Next Greater Element

---

# BFS with Queue
<!-- phase: 1, topic: Stacks & Queues -->

## Steps
- ① Enqueue start node, mark visited | window: [0,0]
- ② Dequeue a, enqueue unvisited neighbors | window: [1,2]
- ③ Process neighbors level by level | window: [2,3]
- ④ Each level = one step further from start | window: [3,4]

## Code
```
from collections import deque
queue = deque([start])
visited = {start}
while queue:
    node = queue.popleft()
    # process node
    for neighbor in graph[node]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
```

## Tip
BFS finds the shortest path in an unweighted graph. Always mark visited when you enqueue (not when you dequeue) to avoid processing a node twice.

## Problems
- Number of Islands
- Word Ladder
- Rotting Oranges

---

# DFS (recursive)
<!-- phase: 1, topic: Trees -->

## Steps
- ① At root a — recurse into left subtree | window: [0,0]
- ② Reach leaf b — base case, return value | window: [1,1]
- ③ Backtrack to a — recurse into right subtree | window: [0,2]
- ④ Combine left + right results at root | window: [0,4]

## Code
```
def dfs(node):
    if not node:           # base case
        return base_value
    left = dfs(node.left)
    right = dfs(node.right)
    return combine(left, right)
```

## Tip
Write the base case first — "what do I return at null?" Once that's clear, the recursive case almost writes itself.

## Problems
- Maximum Depth of Binary Tree
- Invert Binary Tree
- Path Sum

---

# BFS (iterative)
<!-- phase: 1, topic: Trees -->

## Steps
- ① Queue holds first level: [a] | window: [0,0]
- ② Snapshot level size, process all nodes at this level | window: [0,2]
- ③ Enqueue their children for next level | window: [2,4]

## Code
```
from collections import deque
queue = deque([root])
while queue:
    level_size = len(queue)  # snapshot before inner loop
    for _ in range(level_size):
        node = queue.popleft()
        # process node
        if node.left:  queue.append(node.left)
        if node.right: queue.append(node.right)
```

## Tip
`level_size = len(queue)` before the inner loop lets you process exactly one level per outer iteration. Essential for level-order and min-depth problems.

## Problems
- Binary Tree Level Order Traversal
- Minimum Depth of Binary Tree
- Zigzag Level Order Traversal

---

# In/Pre/Post-order
<!-- phase: 1, topic: Trees -->

## Steps
- ① Pre-order: root first, then children | window: [0,0]
- ② In-order: left subtree, root, right subtree | window: [1,3]
- ③ Post-order: children first, root last | window: [2,4]

## Code
```
def inorder(node):   # left → root → right
    if not node: return
    inorder(node.left)
    visit(node)        # ← root in middle
    inorder(node.right)

def preorder(node):  # root → left → right
    if not node: return
    visit(node)        # ← root first
    preorder(node.left)
    preorder(node.right)

def postorder(node): # left → right → root
    if not node: return
    postorder(node.left)
    postorder(node.right)
    visit(node)        # ← root last
```

## Tip
In-order on a BST gives sorted output. Pre-order is used to clone/serialize. Post-order is used to delete or evaluate — children before parent.

## Problems
- Validate Binary Search Tree
- Serialize and Deserialize Binary Tree
- Binary Tree Paths

---

# Top K Elements
<!-- phase: 2, topic: Heaps / Priority Queues -->

## Steps
- ① Push a into min-heap of size K | window: [0,0]
- ② Heap grows past K — pop the smallest | window: [0,2]
- ③ Continue — heap always holds the K largest seen | window: [1,3]
- ④ Return heap contents | window: [1,4]

## Code
```
import heapq
heap = []
for val in arr:
    heapq.heappush(heap, val)
    if len(heap) > k:
        heapq.heappop(heap)  # evict smallest
# heap now contains K largest elements
return list(heap)
```

## Tip
Min-heap of size K for top-K largest. Negate values for top-K smallest. If K appears in the problem, think heap.

## Problems
- Kth Largest Element in Array
- Top K Frequent Elements
- K Closest Points to Origin

---

# Merge K Sorted
<!-- phase: 2, topic: Heaps / Priority Queues -->

## Steps
- ① Push first element of each list into min-heap | window: [0,0]
- ② Pop global min, push next element from same list | window: [0,2]
- ③ Repeat — always extracting the global minimum | window: [1,3]

## Code
```
import heapq
heap = [(lists[i][0], i, 0) for i in range(len(lists))]
heapq.heapify(heap)
result = []
while heap:
    val, li, idx = heapq.heappop(heap)
    result.append(val)
    if idx + 1 < len(lists[li]):
        heapq.heappush(heap, (lists[li][idx + 1], li, idx + 1))
return result
```

## Tip
The heap tuple is (value, list_index, element_index). You need the list index to know where to grab the next element after a pop.

## Problems
- Merge K Sorted Lists
- Find K Pairs with Smallest Sums

---

# Running Median
<!-- phase: 2, topic: Heaps / Priority Queues -->

## Steps
- ① Lower half in max-heap (negated): [a,b] | window: [0,1]
- ② Upper half in min-heap: [c,d,e] | window: [2,4]
- ③ Rebalance after each insert so sizes differ by ≤1 | window: [1,3]

## Code
```
import heapq
small = []  # max-heap (values negated)
large = []  # min-heap

def add(num):
    heapq.heappush(small, -num)
    heapq.heappush(large, -heapq.heappop(small))
    if len(large) > len(small):
        heapq.heappush(small, -heapq.heappop(large))

def median():
    if len(small) == len(large):
        return (-small[0] + large[0]) / 2.0
    return float(-small[0])
```

## Tip
Two heaps: max-heap for left half, min-heap for right half. After every insert, rebalance so sizes differ by at most 1. The median is always at one of the tops.

## Problems
- Find Median from Data Stream
- Sliding Window Median

---

# DFS
<!-- phase: 2, topic: Graph Traversal -->

## Steps
- ① Mark a visited, push to call stack | window: [0,0]
- ② Recurse to unvisited neighbor b | window: [0,1]
- ③ Backtrack when no unvisited neighbors remain | window: [1,3]
- ④ Resume from unfinished nodes | window: [2,4]

## Code
```
def dfs(node, visited):
    visited.add(node)
    # process node
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(neighbor, visited)

visited = set()
dfs(start, visited)
```

## Tip
Always check `if neighbor not in visited` before recursing — graphs have cycles, trees don't. That's the key difference from tree DFS.

## Problems
- Clone Graph
- Number of Connected Components
- Pacific Atlantic Water Flow

---

# BFS
<!-- phase: 2, topic: Graph Traversal -->

## Steps
- ① Enqueue start with distance 0 | window: [0,0]
- ② Dequeue a, enqueue neighbors at distance+1 | window: [0,2]
- ③ Process all nodes at distance 1 | window: [1,3]
- ④ Reach target — shortest path found | window: [2,4]

## Code
```
from collections import deque
queue = deque([(start, 0)])
visited = {start}
while queue:
    node, dist = queue.popleft()
    if node == target:
        return dist
    for neighbor in graph[node]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append((neighbor, dist + 1))
```

## Tip
BFS always finds the shortest path in an unweighted graph. Carry distance in the queue tuple — don't compute it separately.

## Problems
- Word Ladder
- Shortest Path in Binary Matrix
- 01 Matrix

---

# Union-Find
<!-- phase: 2, topic: Graph Traversal -->

## Steps
- ① Each node is its own root | window: [0,4]
- ② Union(a,b): connect a's root to b's root | window: [0,1]
- ③ Union(c,d): connect c's root to d's root | window: [2,3]
- ④ Find(a) == Find(b): same component | window: [0,1]

## Code
```
parent = list(range(n))
rank = [0] * n

def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])  # path compression
    return parent[x]

def union(x, y):
    rx, ry = find(x), find(y)
    if rx == ry: return False
    if rank[rx] < rank[ry]: rx, ry = ry, rx
    parent[ry] = rx
    if rank[rx] == rank[ry]: rank[rx] += 1
    return True
```

## Tip
Path compression + union by rank makes find() nearly O(1). Use for "how many connected components?" or "are X and Y connected?"

## Problems
- Number of Connected Components in Undirected Graph
- Redundant Connection
- Accounts Merge

---

# Topological Sort
<!-- phase: 2, topic: Graph Traversal -->

## Steps
- ① Compute in-degrees for all nodes | window: [0,4]
- ② Enqueue all zero-in-degree nodes | window: [0,1]
- ③ Dequeue node, reduce neighbors' in-degrees | window: [1,3]
- ④ Enqueue newly zero-in-degree nodes | window: [3,4]

## Code
```
from collections import deque, defaultdict
indegree = defaultdict(int)
graph = defaultdict(list)
# build graph + count indegrees from edges...

queue = deque([n for n in all_nodes if indegree[n] == 0])
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for neighbor in graph[node]:
        indegree[neighbor] -= 1
        if indegree[neighbor] == 0:
            queue.append(neighbor)
# len(order) != len(all_nodes) → cycle exists
```

## Tip
If the result length doesn't equal the node count, there's a cycle — no valid topological order. This is also how you detect cycles in directed graphs.

## Problems
- Course Schedule
- Course Schedule II
- Alien Dictionary

---

# Subsets
<!-- phase: 2, topic: Recursion & Backtracking -->

## Steps
- ① Start: result = [[]] (empty subset always included) | window: [0,0]
- ② Include a — recurse with [a] | window: [0,1]
- ③ Exclude a — recurse without | window: [1,2]
- ④ Every recursive call appends to result | window: [0,4]

## Code
```
def backtrack(start, current):
    result.append(list(current))  # add at every node
    for i in range(start, len(nums)):
        current.append(nums[i])
        backtrack(i + 1, current)
        current.pop()             # undo choice

result = []
backtrack(0, [])
```

## Tip
Append to result at every recursive call (not just at leaves) — that's what makes subsets different from permutations.

## Problems
- Subsets
- Subsets II (with duplicates)
- Combination Sum

---

# Permutations
<!-- phase: 2, topic: Recursion & Backtracking -->

## Steps
- ① Fix a at position 0, permute [b,c,d,e] | window: [0,0]
- ② Recurse with b fixed at next position | window: [1,1]
- ③ Leaf reached — record full permutation | window: [0,4]
- ④ Swap back (restore), try next element | window: [0,1]

## Code
```
def backtrack(start):
    if start == len(nums):
        result.append(list(nums))
        return
    for i in range(start, len(nums)):
        nums[start], nums[i] = nums[i], nums[start]   # choose
        backtrack(start + 1)
        nums[start], nums[i] = nums[i], nums[start]   # restore

result = []
backtrack(0)
```

## Tip
Permutations = fix one element at each position and recurse. The swap-and-restore avoids a separate "used" set.

## Problems
- Permutations
- Permutations II (with duplicates)
- Letter Case Permutation

---

# Tree of choices
<!-- phase: 2, topic: Recursion & Backtracking -->

## Steps
- ① At each node: enumerate all valid choices | window: [0,0]
- ② Make a choice, recurse deeper | window: [0,2]
- ③ Hit constraint or leaf — record or prune | window: [2,4]
- ④ Undo choice, try the next branch | window: [0,1]

## Code
```
def backtrack(state):
    if is_solution(state):
        result.append(copy(state))
        return
    for choice in get_choices(state):
        state.apply(choice)    # choose
        backtrack(state)       # explore
        state.undo(choice)     # un-choose

backtrack(initial_state)
```

## Tip
Draw the decision tree before coding. Each node is a state, each edge is a choice. Pruning = cutting branches that can't lead to a valid solution.

## Problems
- Word Search
- N-Queens
- Sudoku Solver

---

# Clarify constraints first
<!-- phase: 3, topic: Mock Interview Reps -->

## Steps
- ① Ask about input type and size — affects your complexity target
- ② Ask about edge cases — empty, null, negatives, duplicates allowed?
- ③ Ask about output format — return value, index, or print?
- ④ Restate the problem back — "so I have a sorted array of ints, no duplicates, return index or -1"

## Code
```
# Before writing any code, ask out loud:
# - What is the input type and range?
# - Can the input be empty or null?
# - Are there duplicates?
# - What should I return for edge cases?
# - Any performance requirements?

# Then say:
# "Let me make sure I understand the problem —
#  [restate it in your own words]. Does that sound right?"
```

## Tip
Clarifying questions signal engineering maturity. Even if you know the answer, asking "can the array be empty?" shows you think about edge cases before touching code.

## Problems
- Apply this to every problem before coding

---

# Brute force → optimize
<!-- phase: 3, topic: Mock Interview Reps -->

## Steps
- ① State brute force first — O(n²) is fine as a starting point
- ② Explain why it's slow — "this recomputes X every iteration"
- ③ Identify the bottleneck — what repeated work can be cached or avoided?
- ④ Optimize — hash map, heap, sliding window, or memo

## Code
```
# Step 1: brute force (say this out loud)
def brute(arr, target):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                return [i, j]

# Step 2: optimize (explain the insight first)
def optimized(arr, target):
    seen = {}
    for i, val in enumerate(arr):
        complement = target - val
        if complement in seen:
            return [seen[complement], i]
        seen[val] = i
```

## Tip
Say "I'll start with brute force to make sure I understand the problem." This is always the right move — it gives you a working solution to optimize from and shows structured thinking.

## Problems
- Apply this meta-pattern to every medium/hard problem

---

# Test with examples
<!-- phase: 3, topic: Mock Interview Reps -->

## Steps
- ① Pick a small concrete example before coding
- ② Trace your algorithm on paper — step by step
- ③ After coding: test happy path, then at least one edge case
- ④ Walk the interviewer through your trace out loud

## Code
```
# Before coding, say:
# "Let me trace through [1, 2, 3, 4, 5] with target=9"

# Trace step by step:
# i=0: val=1, need 8, not seen → {1:0}
# i=1: val=2, need 7, not seen → {1:0, 2:1}
# i=2: val=3, need 6, not seen → {1:0, 2:1, 3:2}
# i=3: val=4, need 5, not seen → {1:0, 2:1, 3:2, 4:3}
# i=4: val=5, need 4, 4 is in map → return [3, 4] ✓
```

## Tip
Walking through an example out loud is not just for your benefit — it lets the interviewer follow your logic and jump in if you're going the wrong way.

## Problems
- Apply this to every problem before submitting

---

# Empty input
<!-- phase: 3, topic: Edge Case Scripting -->

## Steps
- ① Before coding: "what if arr is empty?"
- ② Decide the return value — [], 0, -1, None — and state it
- ③ Add a guard clause at the top of the function
- ④ Include empty input in your trace

## Code
```
def solve(arr):
    if not arr:       # catches [], None, "", 0
        return []     # state your choice out loud

    # ... rest of logic
```

## Tip
"Empty input" breaks almost every algorithm that assumes at least one element. Handle it first — it's a one-liner and shows you think defensively.

## Problems
- Check every problem you solve for empty input

---

# Single element
<!-- phase: 3, topic: Edge Case Scripting -->

## Steps
- ① Ask: does my algorithm work when n=1?
- ② Check loops — does `while left < right` skip correctly for one element?
- ③ Check divide-and-conquer — does splitting [x] work?
- ④ Add [42] as your second test case in every trace

## Code
```
# Two-pointer with one element:
left, right = 0, 0     # left == right → loop never runs
while left < right:    # False immediately — is that correct?
    ...

# Sliding window with one element:
left = 0
for right in range(1):  # runs once: right=0
    # window = arr[0:0] — is that right?
```

## Tip
Single element is where two-pointer and sliding window most commonly break. Always mentally run your algorithm on [42] before coding.

## Problems
- Check every problem you solve for single-element input

---

# All duplicates
<!-- phase: 3, topic: Edge Case Scripting -->

## Steps
- ① Ask: "what if all elements are the same?"
- ② Does your two-pointer still terminate? Check the loop condition
- ③ Does your sliding window constraint handle repeated chars/values?
- ④ Add [5,5,5,5,5] as a test case in your trace

## Code
```
# [5, 5, 5, 5, 5], target = 10
# Two-pointer: arr[0]+arr[4] = 10 → return [0,4] ✓

# Contains Duplicate: freq[5]=5 > 1 → True ✓

# Longest Substring without repeat: "aaaaa"
# window breaks immediately each time → answer = 1 ✓

# Always ask: "what does my algorithm return for [1,1,1,1,1]?"
```

## Tip
Duplicates break uniqueness assumptions. If your algorithm assumes distinct elements, state that: "I'm assuming no duplicates — is that guaranteed?"

## Problems
- Check every problem for all-duplicates input

---

# Negative numbers
<!-- phase: 3, topic: Edge Case Scripting -->

## Steps
- ① Ask: "can the input contain negatives?"
- ② Check your max/min initialization — never initialize to 0
- ③ Check your window constraint — does it still make sense with negatives?
- ④ Add [-3,-2,-1] as a test case

## Code
```
# Common bug — initializing to 0 breaks with all negatives:
max_val = 0             # wrong for [-3, -2, -1]

# Correct:
max_val = float('-inf') # works for any input
# or:
max_val = arr[0]        # works if arr is non-empty

# For min:
min_val = float('inf')
```

## Tip
Never initialize max to 0 if the answer could be negative. Use `float('-inf')` for max and `float('inf')` for min. Say it explicitly in your trace.

## Problems
- Check every problem involving sums or max/min for negative input

---

# Know your Big-O before you submit
<!-- phase: 3, topic: Complexity Fluency -->

## Steps
- ① Count loops — nested = O(n²), single pass = O(n)
- ② Identify what scales with input for space — maps, stacks, output
- ③ State both time and space before finishing
- ④ Know the next level: "I could reduce from O(n²) to O(n) with a hash map"

## Code
```
# Time complexity quick reference:
# Single loop              → O(n)
# Nested loops             → O(n²)
# Binary search in a loop  → O(n log n)
# Recursive with 2 branches→ O(2^n)
# Backtracking             → O(n!) worst case

# Space complexity quick reference:
# Hash map of input        → O(n)
# Recursion stack (tree)   → O(h), worst O(n)
# Output array             → O(n) (sometimes excluded)

# Say out loud before finishing:
# "Time is O(n), space is O(n) for the hash map."
```

## Tip
Say the complexity unprompted — before the interviewer asks. It signals you treat performance as a habit, not an afterthought.

## Problems
- State complexity for every problem you solve this week

---

# Space vs Time trade-offs
<!-- phase: 3, topic: Complexity Fluency -->

## Steps
- ① Identify the bottleneck: is the slow part in time or space?
- ② Caching trades space for time — memoization, hash maps
- ③ In-place algorithms trade time for space — recompute instead of store
- ④ State the trade-off explicitly before the interviewer asks

## Code
```
# Space for time: memoization
cache = {}
def fib(n):
    if n in cache: return cache[n]      # O(n) space
    cache[n] = fib(n-1) + fib(n-2)     # O(n) time
    return cache[n]

# Time for space: rolling variables
def fib_optimized(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b                 # O(1) space, O(n) time
    return a
```

## Tip
When asked "can you do better?" — consider both dimensions. O(n) space for O(n) time is often the right answer coming from O(n²). State that trade-off explicitly.

## Problems
- Apply this analysis to every problem you optimize
```

- [ ] **Step 2: Verify the file parses correctly**

Start the dev server and open the browser console:

```bash
cd /Users/queenellie/partifulprep/partiful-app && npm run dev
```

In the browser console (after wiring up in Task 5), verify the parsed array has 28 entries. For now, just confirm the file was created with no syntax errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/queenellie/partifulprep/partiful-app && git add src/patterns.md && git commit -m "feat: add patterns.md with all 28 pattern entries"
```

---

## Task 4: Create `src/PatternPage.jsx`

**Files:**
- Create: `src/PatternPage.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useRef } from 'react';
import { slugify } from './parsePatterns';

const DEMO = ['a', 'b', 'c', 'd', 'e'];

function StepDiagram({ steps, color }) {
  return (
    <div style={{ background: '#13131A', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #1E1E28' }}>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>How it moves</div>
      {steps.map((step, si) => (
        <div key={si} style={{ marginBottom: si < steps.length - 1 ? 16 : 0 }}>
          <div style={{ fontSize: 11, color: color + 'CC', marginBottom: step.window ? 8 : 0, lineHeight: 1.5 }}>
            {step.label}
          </div>
          {step.window && (
            <div style={{ display: 'flex', gap: 4 }}>
              {DEMO.map((el, i) => {
                const [l, r] = step.window;
                const inWindow = i >= l && i <= r;
                const dropped = i < l;
                return (
                  <div key={i} style={{
                    width: 30, height: 30,
                    background: inWindow ? color + '33' : '#1E1E28',
                    border: inWindow
                      ? `1.5px solid ${color}`
                      : dropped
                        ? '1.5px dashed #333'
                        : '1.5px solid transparent',
                    borderRadius: 4,
                    fontSize: 11,
                    color: inWindow ? color : dropped ? '#333' : '#444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: inWindow ? 700 : 400,
                  }}>{el}</div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <div style={{ background: '#13131A', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #1E1E28' }}>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Code shape</div>
      <div style={{ fontSize: 12, lineHeight: 1.9, whiteSpace: 'pre', fontFamily: 'inherit', overflowX: 'auto' }}>
        {code.split('\n').map((line, i) => (
          <div key={i} style={{ color: line.trim().startsWith('#') ? '#555' : '#AAA' }}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function NotesSection({ patternName }) {
  const key = `pattern-notes-${slugify(patternName)}`;
  const [notes, setNotes] = useState(() => localStorage.getItem(key) || '');
  const timerRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => localStorage.setItem(key, val), 500);
  };

  return (
    <div style={{ background: '#13131A', borderRadius: 10, padding: 16, border: '1px solid #1E1E28' }}>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Your notes</div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Add your own notes, mnemonics, or insights..."
        style={{
          width: '100%',
          minHeight: 80,
          background: '#0D0D0F',
          border: '1px solid #2A2A32',
          borderRadius: 6,
          padding: '10px 12px',
          color: '#AAA',
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: 9, color: '#444', marginTop: 6 }}>saved automatically</div>
    </div>
  );
}

export default function PatternPage({
  patternData,
  phaseColor,
  phaseLabel,
  topicName,
  onBack,
  prevPattern,
  nextPattern,
  onNavigate,
  relatedProblems,
}) {
  const navBtn = {
    background: 'none', border: 'none', color: '#555', fontSize: 11,
    cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  };

  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      background: '#0D0D0F',
      color: '#F0EEF8',
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      boxSizing: 'border-box',
    }}>
      {/* Nav bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', borderBottom: '1px solid #1E1E28',
      }}>
        <button onClick={onBack} style={{ ...navBtn, color: '#666', fontSize: 12 }}>
          ← Back to study plan
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          {prevPattern && (
            <button onClick={() => onNavigate(prevPattern)} style={navBtn}>
              ← {prevPattern.patternName}
            </button>
          )}
          {nextPattern && (
            <button onClick={() => onNavigate(nextPattern)} style={navBtn}>
              {nextPattern.patternName} →
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            {phaseLabel} · {topicName}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: phaseColor, lineHeight: 1.1 }}>
            {patternData ? patternData.name : 'Pattern'}
          </div>
        </div>

        {!patternData ? (
          <p style={{ color: '#555', fontSize: 13 }}>Details for this pattern coming soon.</p>
        ) : (
          <>
            {patternData.steps.length > 0 && (
              <StepDiagram steps={patternData.steps} color={phaseColor} />
            )}

            {patternData.code && (
              <CodeBlock code={patternData.code} />
            )}

            {patternData.tip && (
              <div style={{
                borderLeft: '3px solid #FF4F9A',
                padding: '10px 14px',
                borderRadius: '0 6px 6px 0',
                fontSize: 12, color: '#888', lineHeight: 1.6,
                background: '#0D0D12', marginBottom: 14,
              }}>
                💡 {patternData.tip}
              </div>
            )}

            {relatedProblems.length > 0 && (
              <div style={{ background: '#13131A', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #1E1E28' }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                  Problems using this pattern
                </div>
                {relatedProblems.map((p, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: '#888', padding: '5px 0',
                    borderBottom: i < relatedProblems.length - 1 ? '1px solid #1E1E28' : 'none',
                  }}>
                    · {p}
                  </div>
                ))}
              </div>
            )}

            <NotesSection patternName={patternData.name} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/queenellie/partifulprep/partiful-app && git add src/PatternPage.jsx && git commit -m "feat: add PatternPage component with diagram, code, tip, and notes"
```

---

## Task 5: Wire up `src/prepdoc.jsx`

**Files:**
- Modify: `src/prepdoc.jsx`

- [ ] **Step 1: Add imports at the top of the file**

Replace the existing import line:
```js
import { useState } from "react";
```
With:
```js
import { useState } from "react";
import PatternPage from "./PatternPage";
import { parsePatterns } from "./parsePatterns";
import patternsRaw from "./patterns.md?raw";

const parsedPatterns = parsePatterns(patternsRaw);
```

- [ ] **Step 2: Add view state inside `StudyPlan`**

After the existing state declarations (`activePhase`, `checked`, `showTips`), add:
```js
const [view, setView] = useState('plan');
const [activePatternKey, setActivePatternKey] = useState(null);
```

- [ ] **Step 3: Add the pattern view render block**

Add this block immediately before the `return (` statement in `StudyPlan`:

```js
if (view === 'pattern' && activePatternKey) {
  const activePhaseData = plan.phases[activePatternKey.phaseIndex];
  const activeTopic = activePhaseData.topics[activePatternKey.topicIndex];

  const flatPatterns = activePhaseData.topics.flatMap((t, ti) =>
    t.patterns.map((p) => ({
      patternName: p,
      phaseIndex: activePatternKey.phaseIndex,
      topicIndex: ti,
    }))
  );
  const currentIdx = flatPatterns.findIndex(
    (p) => p.patternName === activePatternKey.patternName
  );
  const prevPattern = currentIdx > 0 ? flatPatterns[currentIdx - 1] : null;
  const nextPattern =
    currentIdx < flatPatterns.length - 1 ? flatPatterns[currentIdx + 1] : null;

  const patternData =
    parsedPatterns.find((p) => p.name === activePatternKey.patternName) || null;

  const relatedProblems = [];
  plan.phases.forEach((ph) => {
    ph.topics.forEach((t) => {
      if (t.patterns.includes(activePatternKey.patternName)) {
        relatedProblems.push(...t.problems);
      }
    });
  });

  return (
    <PatternPage
      patternData={patternData}
      phaseColor={activePhaseData.color}
      phaseLabel={activePhaseData.label}
      topicName={activeTopic.ds}
      onBack={() => setView('plan')}
      prevPattern={prevPattern}
      nextPattern={nextPattern}
      onNavigate={(key) => setActivePatternKey(key)}
      relatedProblems={relatedProblems}
    />
  );
}
```

- [ ] **Step 4: Make pattern pills clickable**

Find the pattern pill `<span>` (around line 191) and replace it:

```jsx
// BEFORE:
<span key={pi} style={{
  background: phase.accent + "22",
  color: phase.color,
  fontSize: 11,
  padding: "3px 10px",
  borderRadius: 20,
  border: `1px solid ${phase.color}33`
}}>{p}</span>

// AFTER:
<span
  key={pi}
  onClick={() => {
    setActivePatternKey({ phaseIndex: activePhase, topicIndex: ti, patternName: p });
    setView('pattern');
  }}
  style={{
    background: phase.accent + "22",
    color: phase.color,
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    border: `1px solid ${phase.color}33`,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
>{p}</span>
```

- [ ] **Step 5: Verify in browser**

```bash
cd /Users/queenellie/partifulprep/partiful-app && npm run dev
```

Check:
1. Click any pattern pill → navigates to pattern page
2. Pattern page shows step diagram, code, tip, related problems, notes textarea
3. Phase 3 pills (no window data) show steps as text only, no array diagram
4. Back button returns to study plan
5. Prev/next navigate between patterns in the same phase
6. Type in notes textarea, refresh page — notes persist

- [ ] **Step 6: Commit**

```bash
cd /Users/queenellie/partifulprep/partiful-app && git add src/prepdoc.jsx && git commit -m "feat: wire up clickable pattern pills with full-screen pattern detail page"
```
