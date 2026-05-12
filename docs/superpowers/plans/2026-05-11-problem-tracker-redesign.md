# Problem Tracker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app into a NeetCode 150 tracker with per-problem notes/learnings, 1–5 difficulty ratings, AI-powered solution review via Claude, and a daily hard-problem reinforcement loop.

**Architecture:** Express backend (port 3001) reads/writes solution markdown files using gray-matter, calls Claude API on save, and serves POTD + weak-area data. Vite proxies `/api/*` to Express in dev. Frontend has two tabs: Today (POTD + weak areas) and Problems (NeetCode 150 list with solution modal).

**Tech Stack:** React 19 + Vite 8, Express, gray-matter, @anthropic-ai/sdk, dotenv, concurrently

---

## File Map

**Create:**
- `src/problems.json` — NeetCode 150 problem list (static data shared by frontend + backend)
- `server/index.js` — Express entry point
- `server/routes/solutions.js` — GET /problems, GET/POST/PATCH /solutions/:id
- `server/routes/potd.js` — GET /potd
- `server/routes/weakAreas.js` — GET /weak-areas
- `server/lib/parseSolution.js` — gray-matter read/write helpers
- `server/lib/scoring.js` — weak area scoring logic
- `server/lib/weakAreaSuggestions.js` — hardcoded extra problems per category
- `src/ProblemsTab.jsx` — NeetCode 150 list grouped by category
- `src/ProblemModal.jsx` — solution upload/view modal
- `src/TodayTab.jsx` — POTD card + weak areas

**Modify:**
- `package.json` — add express, gray-matter, @anthropic-ai/sdk, dotenv, concurrently; update scripts
- `vite.config.js` — add /api proxy to port 3001
- `src/App.jsx` — two-tab shell with modal state

**Delete:**
- `src/PatternPage.jsx`
- `src/parsePatterns.js`
- `src/parsePatterns.test.js`
- `src/patterns.md`
- `src/prepdoc.jsx`

---

## Task 1: Add dependencies and configure dev environment

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `.env` (not committed)

- [ ] **Step 1: Install server dependencies**

```bash
npm install express gray-matter @anthropic-ai/sdk dotenv
npm install --save-dev concurrently
```

- [ ] **Step 2: Update package.json scripts**

Replace the `"scripts"` block in `package.json` with:

```json
"scripts": {
  "dev": "concurrently \"vite\" \"node server/index.js\"",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "server": "node server/index.js"
},
```

- [ ] **Step 3: Add API proxy to vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

- [ ] **Step 4: Create .env file**

Create `.env` in the project root (do not commit):
```
ANTHROPIC_API_KEY=your_key_here
```

Verify `.gitignore` contains `.env`. If not, add it.

---

## Task 2: Create NeetCode 150 data file

**Files:**
- Create: `src/problems.json`

- [ ] **Step 1: Create src/problems.json**

```json
[
  { "id": "contains_duplicate", "title": "Contains Duplicate", "category": "Arrays & Hashing", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/contains-duplicate/" },
  { "id": "valid_anagram", "title": "Valid Anagram", "category": "Arrays & Hashing", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/valid-anagram/" },
  { "id": "two_sum", "title": "Two Sum", "category": "Arrays & Hashing", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/two-sum/" },
  { "id": "group_anagrams", "title": "Group Anagrams", "category": "Arrays & Hashing", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/group-anagrams/" },
  { "id": "top_k", "title": "Top K Frequent Elements", "category": "Arrays & Hashing", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/top-k-frequent-elements/" },
  { "id": "encode_decode", "title": "Encode and Decode Strings", "category": "Arrays & Hashing", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/encode-and-decode-strings/" },
  { "id": "product_of_array_except_self", "title": "Product of Array Except Self", "category": "Arrays & Hashing", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/product-of-array-except-self/" },
  { "id": "valid_sudoku", "title": "Valid Sudoku", "category": "Arrays & Hashing", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/valid-sudoku/" },
  { "id": "longest_consecutive_sequence", "title": "Longest Consecutive Sequence", "category": "Arrays & Hashing", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/longest-consecutive-sequence/" },

  { "id": "valid_palindrome", "title": "Valid Palindrome", "category": "Two Pointers", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/valid-palindrome/" },
  { "id": "two_sum_ii", "title": "Two Sum II Input Array Is Sorted", "category": "Two Pointers", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/" },
  { "id": "3sum", "title": "3Sum", "category": "Two Pointers", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/3sum/" },
  { "id": "container_with_most_water", "title": "Container With Most Water", "category": "Two Pointers", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/container-with-most-water/" },
  { "id": "trapping_rain_water", "title": "Trapping Rain Water", "category": "Two Pointers", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/trapping-rain-water/" },

  { "id": "buy_and_sell", "title": "Best Time to Buy and Sell Stock", "category": "Sliding Window", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  { "id": "longest_substring", "title": "Longest Substring Without Repeating Characters", "category": "Sliding Window", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { "id": "longest_repeating_character_replacement", "title": "Longest Repeating Character Replacement", "category": "Sliding Window", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/longest-repeating-character-replacement/" },
  { "id": "permutation_in_string", "title": "Permutation in String", "category": "Sliding Window", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/permutation-in-string/" },
  { "id": "minimum_window_substring", "title": "Minimum Window Substring", "category": "Sliding Window", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/minimum-window-substring/" },
  { "id": "sliding_window_maximum", "title": "Sliding Window Maximum", "category": "Sliding Window", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/sliding-window-maximum/" },

  { "id": "valid_parenthesis", "title": "Valid Parentheses", "category": "Stack", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/valid-parentheses/" },
  { "id": "min_stack", "title": "Min Stack", "category": "Stack", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/min-stack/" },
  { "id": "evaluate_reverse_polish_notation", "title": "Evaluate Reverse Polish Notation", "category": "Stack", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/evaluate-reverse-polish-notation/" },
  { "id": "generate_parentheses", "title": "Generate Parentheses", "category": "Stack", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/generate-parentheses/" },
  { "id": "daily_temperatures", "title": "Daily Temperatures", "category": "Stack", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/daily-temperatures/" },
  { "id": "car_fleet", "title": "Car Fleet", "category": "Stack", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/car-fleet/" },
  { "id": "largest_rectangle_in_histogram", "title": "Largest Rectangle in Histogram", "category": "Stack", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/largest-rectangle-in-histogram/" },

  { "id": "binary_search", "title": "Binary Search", "category": "Binary Search", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/binary-search/" },
  { "id": "search_a_2d_matrix", "title": "Search a 2D Matrix", "category": "Binary Search", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/search-a-2d-matrix/" },
  { "id": "koko_eating_bananas", "title": "Koko Eating Bananas", "category": "Binary Search", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/koko-eating-bananas/" },
  { "id": "find_minimum_in_rotated_sorted_array", "title": "Find Minimum in Rotated Sorted Array", "category": "Binary Search", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
  { "id": "search_in_rotated_sorted_array", "title": "Search in Rotated Sorted Array", "category": "Binary Search", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
  { "id": "time_based_key_value_store", "title": "Time Based Key Value Store", "category": "Binary Search", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/time-based-key-value-store/" },
  { "id": "median_of_two_sorted_arrays", "title": "Median of Two Sorted Arrays", "category": "Binary Search", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/median-of-two-sorted-arrays/" },

  { "id": "reverse_linked_list", "title": "Reverse Linked List", "category": "Linked List", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/reverse-linked-list/" },
  { "id": "merge_two_sorted_lists", "title": "Merge Two Sorted Lists", "category": "Linked List", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/merge-two-sorted-lists/" },
  { "id": "reorder_list", "title": "Reorder List", "category": "Linked List", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/reorder-list/" },
  { "id": "remove_nth_node_from_end_of_list", "title": "Remove Nth Node From End of List", "category": "Linked List", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/" },
  { "id": "copy_list_with_random_pointer", "title": "Copy List with Random Pointer", "category": "Linked List", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/copy-list-with-random-pointer/" },
  { "id": "add_two_numbers", "title": "Add Two Numbers", "category": "Linked List", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/add-two-numbers/" },
  { "id": "linked_list_cycle", "title": "Linked List Cycle", "category": "Linked List", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/linked-list-cycle/" },
  { "id": "find_the_duplicate_number", "title": "Find the Duplicate Number", "category": "Linked List", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/find-the-duplicate-number/" },
  { "id": "lru_cache", "title": "LRU Cache", "category": "Linked List", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/lru-cache/" },
  { "id": "merge_k_sorted_lists", "title": "Merge K Sorted Lists", "category": "Linked List", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/merge-k-sorted-lists/" },
  { "id": "reverse_nodes_in_k_group", "title": "Reverse Nodes in K Group", "category": "Linked List", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/reverse-nodes-in-k-group/" },

  { "id": "invert_bt", "title": "Invert Binary Tree", "category": "Trees", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/invert-binary-tree/" },
  { "id": "max_depth_bt", "title": "Maximum Depth of Binary Tree", "category": "Trees", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
  { "id": "diameter_of_binary_tree", "title": "Diameter of Binary Tree", "category": "Trees", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/diameter-of-binary-tree/" },
  { "id": "balanced_binary_tree", "title": "Balanced Binary Tree", "category": "Trees", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/balanced-binary-tree/" },
  { "id": "same_tree", "title": "Same Tree", "category": "Trees", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/same-tree/" },
  { "id": "subtree_of_another_tree", "title": "Subtree of Another Tree", "category": "Trees", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/subtree-of-another-tree/" },
  { "id": "lowest_common_ancestor_of_bst", "title": "Lowest Common Ancestor of BST", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/" },
  { "id": "tree_level_traversal", "title": "Binary Tree Level Order Traversal", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
  { "id": "binary_tree_right_side_view", "title": "Binary Tree Right Side View", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/binary-tree-right-side-view/" },
  { "id": "count_good_nodes_in_binary_tree", "title": "Count Good Nodes in Binary Tree", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/count-good-nodes-in-binary-tree/" },
  { "id": "validate_binary_search_tree", "title": "Validate Binary Search Tree", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/validate-binary-search-tree/" },
  { "id": "kth_smallest_element_in_a_bst", "title": "Kth Smallest Element in a BST", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/" },
  { "id": "construct_binary_tree", "title": "Construct Binary Tree from Preorder and Inorder Traversal", "category": "Trees", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/" },
  { "id": "binary_tree_maximum_path_sum", "title": "Binary Tree Maximum Path Sum", "category": "Trees", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
  { "id": "serialize_and_deserialize_binary_tree", "title": "Serialize and Deserialize Binary Tree", "category": "Trees", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/" },

  { "id": "implement_trie", "title": "Implement Trie", "category": "Tries", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/implement-trie-prefix-tree/" },
  { "id": "design_add_and_search_words", "title": "Design Add and Search Words Data Structure", "category": "Tries", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/design-add-and-search-words-data-structure/" },
  { "id": "word_search_ii", "title": "Word Search II", "category": "Tries", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/word-search-ii/" },

  { "id": "kth_largest", "title": "Kth Largest Element in a Stream", "category": "Heap / Priority Queue", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/kth-largest-element-in-a-stream/" },
  { "id": "last_stone_weight", "title": "Last Stone Weight", "category": "Heap / Priority Queue", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/last-stone-weight/" },
  { "id": "k_closest_points_to_origin", "title": "K Closest Points to Origin", "category": "Heap / Priority Queue", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/k-closest-points-to-origin/" },
  { "id": "kth_largest_element_in_an_array", "title": "Kth Largest Element in an Array", "category": "Heap / Priority Queue", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/kth-largest-element-in-an-array/" },
  { "id": "task_scheduler", "title": "Task Scheduler", "category": "Heap / Priority Queue", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/task-scheduler/" },
  { "id": "design_twitter", "title": "Design Twitter", "category": "Heap / Priority Queue", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/design-twitter/" },
  { "id": "find_median_from_data_stream", "title": "Find Median from Data Stream", "category": "Heap / Priority Queue", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/find-median-from-data-stream/" },

  { "id": "subsets", "title": "Subsets", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/subsets/" },
  { "id": "combination_sum", "title": "Combination Sum", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/combination-sum/" },
  { "id": "permutations", "title": "Permutations", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/permutations/" },
  { "id": "subsets_ii", "title": "Subsets II", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/subsets-ii/" },
  { "id": "combination_sum_ii", "title": "Combination Sum II", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/combination-sum-ii/" },
  { "id": "word_search", "title": "Word Search", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/word-search/" },
  { "id": "palindrome_partitioning", "title": "Palindrome Partitioning", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/palindrome-partitioning/" },
  { "id": "letter_combinations_of_a_phone_number", "title": "Letter Combinations of a Phone Number", "category": "Backtracking", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/" },
  { "id": "n_queens", "title": "N Queens", "category": "Backtracking", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/n-queens/" },

  { "id": "num_of_islands", "title": "Number of Islands", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/number-of-islands/" },
  { "id": "clone_graph", "title": "Clone Graph", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/clone-graph/" },
  { "id": "max_area_island", "title": "Max Area of Island", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/max-area-of-island/" },
  { "id": "pacific_atlantic_water_flow", "title": "Pacific Atlantic Water Flow", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/pacific-atlantic-water-flow/" },
  { "id": "surrounded_regions", "title": "Surrounded Regions", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/surrounded-regions/" },
  { "id": "rotting_oranges", "title": "Rotting Oranges", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/rotting-oranges/" },
  { "id": "islands_and_treasures", "title": "Walls and Gates", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/walls-and-gates/" },
  { "id": "course_schedule", "title": "Course Schedule", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/course-schedule/" },
  { "id": "course_schedule_ii", "title": "Course Schedule II", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/course-schedule-ii/" },
  { "id": "redundant_connection", "title": "Redundant Connection", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/redundant-connection/" },
  { "id": "number_of_connected_components", "title": "Number of Connected Components in an Undirected Graph", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/" },
  { "id": "graph_valid_tree", "title": "Graph Valid Tree", "category": "Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/graph-valid-tree/" },
  { "id": "word_ladder", "title": "Word Ladder", "category": "Graphs", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/word-ladder/" },

  { "id": "reconstruct_itinerary", "title": "Reconstruct Itinerary", "category": "Advanced Graphs", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/reconstruct-itinerary/" },
  { "id": "min_cost_to_connect_all_points", "title": "Min Cost to Connect All Points", "category": "Advanced Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/min-cost-to-connect-all-points/" },
  { "id": "network_delay_time", "title": "Network Delay Time", "category": "Advanced Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/network-delay-time/" },
  { "id": "swim_in_rising_water", "title": "Swim in Rising Water", "category": "Advanced Graphs", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/swim-in-rising-water/" },
  { "id": "alien_dictionary", "title": "Alien Dictionary", "category": "Advanced Graphs", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/alien-dictionary/" },
  { "id": "cheapest_flights_within_k_stops", "title": "Cheapest Flights within K Stops", "category": "Advanced Graphs", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },

  { "id": "climbing_stairs", "title": "Climbing Stairs", "category": "1-D Dynamic Programming", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/climbing-stairs/" },
  { "id": "min_cost_climbing_stairs", "title": "Min Cost Climbing Stairs", "category": "1-D Dynamic Programming", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/min-cost-climbing-stairs/" },
  { "id": "house_robber", "title": "House Robber", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/house-robber/" },
  { "id": "house_robber_ii", "title": "House Robber II", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/house-robber-ii/" },
  { "id": "longest_palindromic_substring", "title": "Longest Palindromic Substring", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/longest-palindromic-substring/" },
  { "id": "palindromic_substrings", "title": "Palindromic Substrings", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/palindromic-substrings/" },
  { "id": "decode_ways", "title": "Decode Ways", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/decode-ways/" },
  { "id": "coin_change", "title": "Coin Change", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/coin-change/" },
  { "id": "maximum_product_subarray", "title": "Maximum Product Subarray", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/maximum-product-subarray/" },
  { "id": "word_break", "title": "Word Break", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/word-break/" },
  { "id": "longest_increasing_subsequence", "title": "Longest Increasing Subsequence", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { "id": "partition_equal_subset_sum", "title": "Partition Equal Subset Sum", "category": "1-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/partition-equal-subset-sum/" },

  { "id": "unique_paths", "title": "Unique Paths", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/unique-paths/" },
  { "id": "longest_common_subsequence", "title": "Longest Common Subsequence", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/longest-common-subsequence/" },
  { "id": "buy_sell_with_cooldown", "title": "Best Time to Buy and Sell Stock With Cooldown", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/" },
  { "id": "coin_change_ii", "title": "Coin Change II", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/coin-change-ii/" },
  { "id": "target_sum", "title": "Target Sum", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/target-sum/" },
  { "id": "interleaving_string", "title": "Interleaving String", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/interleaving-string/" },
  { "id": "longest_increasing_path_in_a_matrix", "title": "Longest Increasing Path in a Matrix", "category": "2-D Dynamic Programming", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/" },
  { "id": "distinct_subsequences", "title": "Distinct Subsequences", "category": "2-D Dynamic Programming", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/distinct-subsequences/" },
  { "id": "edit_distance", "title": "Edit Distance", "category": "2-D Dynamic Programming", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/edit-distance/" },
  { "id": "burst_balloons", "title": "Burst Balloons", "category": "2-D Dynamic Programming", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/burst-balloons/" },
  { "id": "regular_expression_matching", "title": "Regular Expression Matching", "category": "2-D Dynamic Programming", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/regular-expression-matching/" },

  { "id": "maximum_subarray", "title": "Maximum Subarray", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/maximum-subarray/" },
  { "id": "jump_game", "title": "Jump Game", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/jump-game/" },
  { "id": "jump_game_ii", "title": "Jump Game II", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/jump-game-ii/" },
  { "id": "gas_station", "title": "Gas Station", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/gas-station/" },
  { "id": "hand_of_straights", "title": "Hand of Straights", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/hand-of-straights/" },
  { "id": "merge_triplets_to_form_target_triplet", "title": "Merge Triplets to Form Target Triplet", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/merge-triplets-to-form-target-triplet/" },
  { "id": "partition_labels", "title": "Partition Labels", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/partition-labels/" },
  { "id": "valid_parenthesis_string", "title": "Valid Parenthesis String", "category": "Greedy", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/valid-parenthesis-string/" },

  { "id": "insert_interval", "title": "Insert Interval", "category": "Intervals", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/insert-interval/" },
  { "id": "merge_intervals", "title": "Merge Intervals", "category": "Intervals", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/merge-intervals/" },
  { "id": "non_overlapping_intervals", "title": "Non-overlapping Intervals", "category": "Intervals", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/non-overlapping-intervals/" },
  { "id": "meeting_rooms", "title": "Meeting Rooms", "category": "Intervals", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/meeting-rooms/" },
  { "id": "meeting_rooms_ii", "title": "Meeting Rooms II", "category": "Intervals", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/meeting-rooms-ii/" },
  { "id": "minimum_interval_to_include_each_query", "title": "Minimum Interval to Include Each Query", "category": "Intervals", "lcDifficulty": "Hard", "leetcodeUrl": "https://leetcode.com/problems/minimum-interval-to-include-each-query/" },

  { "id": "rotate_image", "title": "Rotate Image", "category": "Math & Geometry", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/rotate-image/" },
  { "id": "spiral_matrix", "title": "Spiral Matrix", "category": "Math & Geometry", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/spiral-matrix/" },
  { "id": "set_matrix_zeroes", "title": "Set Matrix Zeroes", "category": "Math & Geometry", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/set-matrix-zeroes/" },
  { "id": "happy_number", "title": "Happy Number", "category": "Math & Geometry", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/happy-number/" },
  { "id": "plus_one", "title": "Plus One", "category": "Math & Geometry", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/plus-one/" },
  { "id": "pow_x_n", "title": "Pow(x, n)", "category": "Math & Geometry", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/powx-n/" },
  { "id": "multiply_strings", "title": "Multiply Strings", "category": "Math & Geometry", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/multiply-strings/" },
  { "id": "detect_squares", "title": "Detect Squares", "category": "Math & Geometry", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/detect-squares/" },

  { "id": "single_number", "title": "Single Number", "category": "Bit Manipulation", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/single-number/" },
  { "id": "number_of_1_bits", "title": "Number of 1 Bits", "category": "Bit Manipulation", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/number-of-1-bits/" },
  { "id": "counting_bits", "title": "Counting Bits", "category": "Bit Manipulation", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/counting-bits/" },
  { "id": "reverse_bits", "title": "Reverse Bits", "category": "Bit Manipulation", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/reverse-bits/" },
  { "id": "missing_number", "title": "Missing Number", "category": "Bit Manipulation", "lcDifficulty": "Easy", "leetcodeUrl": "https://leetcode.com/problems/missing-number/" },
  { "id": "sum_of_two_integers", "title": "Sum of Two Integers", "category": "Bit Manipulation", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/sum-of-two-integers/" },
  { "id": "reverse_integer", "title": "Reverse Integer", "category": "Bit Manipulation", "lcDifficulty": "Medium", "leetcodeUrl": "https://leetcode.com/problems/reverse-integer/" }
]
```

---

## Task 3: Create server/lib/parseSolution.js

**Files:**
- Create: `server/lib/parseSolution.js`

- [ ] **Step 1: Create server/lib/parseSolution.js**

```js
import matter from 'gray-matter';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOLUTIONS_DIR = join(__dirname, '../../docs/completed_problems');

export function readSolution(id) {
  const filePath = join(SOLUTIONS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const codeMatch = content.match(/```(\w*)\n([\s\S]*?)```/);
  return {
    id,
    solved: true,
    difficulty: data.difficulty || null,
    date: data.date || null,
    notes: data.notes || '',
    learnings: data.learnings || '',
    timeComplexity: data.timeComplexity || '',
    spaceComplexity: data.spaceComplexity || '',
    comparison: data.comparison || null,
    aiReview: data.aiReview || null,
    aiScore: data.aiScore || null,
    language: codeMatch ? codeMatch[1] || 'python' : 'python',
    code: codeMatch ? codeMatch[2].trim() : '',
  };
}

export function writeSolution(id, title, fields) {
  const { language, code, difficulty, date, notes, learnings, timeComplexity, spaceComplexity, aiReview, aiScore } = fields;
  const frontmatter = { difficulty, date, notes, learnings, timeComplexity, spaceComplexity, aiReview, aiScore };
  const content = `## ${title}\n\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  fs.mkdirSync(SOLUTIONS_DIR, { recursive: true });
  fs.writeFileSync(join(SOLUTIONS_DIR, `${id}.md`), matter.stringify(content, frontmatter));
}

export function patchSolution(id, fields) {
  const filePath = join(SOLUTIONS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  fs.writeFileSync(filePath, matter.stringify(content, { ...data, ...fields }));
  return readSolution(id);
}

export function getAllSolutions() {
  if (!fs.existsSync(SOLUTIONS_DIR)) return {};
  return Object.fromEntries(
    fs.readdirSync(SOLUTIONS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const id = f.replace('.md', '');
        return [id, readSolution(id)];
      })
  );
}
```

---

## Task 4: Create server/lib/scoring.js and server/lib/weakAreaSuggestions.js

**Files:**
- Create: `server/lib/scoring.js`
- Create: `server/lib/weakAreaSuggestions.js`

- [ ] **Step 1: Create server/lib/scoring.js**

```js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAllSolutions } from './parseSolution.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(__dirname, '../../src/problems.json'), 'utf8'));

export function computeWeakAreas() {
  const solutions = getAllSolutions();
  const categoryData = {};

  for (const problem of problems) {
    const sol = solutions[problem.id];
    if (!sol?.difficulty) continue;
    if (!categoryData[problem.category]) {
      categoryData[problem.category] = { difficulties: [], comparisons: [] };
    }
    categoryData[problem.category].difficulties.push(sol.difficulty);
    if (sol.comparison?.result) {
      categoryData[problem.category].comparisons.push(sol.comparison.result);
    }
  }

  return Object.entries(categoryData)
    .map(([category, { difficulties, comparisons }]) => {
      const avg = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
      const adj = comparisons.reduce((acc, r) => acc + (r === 'harder' ? 0.2 : -0.1), 0);
      return { category, weightedScore: Math.round((avg + adj) * 10) / 10 };
    })
    .filter(a => a.weightedScore >= 3.5)
    .sort((a, b) => b.weightedScore - a.weightedScore);
}
```

- [ ] **Step 2: Create server/lib/weakAreaSuggestions.js**

```js
export const weakAreaSuggestions = {
  "Arrays & Hashing": [
    { title: "Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k/" },
    { title: "Find All Anagrams in a String", url: "https://leetcode.com/problems/find-all-anagrams-in-a-string/" },
    { title: "4Sum", url: "https://leetcode.com/problems/4sum/" },
    { title: "Majority Element II", url: "https://leetcode.com/problems/majority-element-ii/" },
  ],
  "Two Pointers": [
    { title: "Sort Colors", url: "https://leetcode.com/problems/sort-colors/" },
    { title: "Remove Duplicates from Sorted Array", url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/" },
    { title: "Boats to Save People", url: "https://leetcode.com/problems/boats-to-save-people/" },
  ],
  "Sliding Window": [
    { title: "Fruit Into Baskets", url: "https://leetcode.com/problems/fruit-into-baskets/" },
    { title: "Grumpy Bookstore Owner", url: "https://leetcode.com/problems/grumpy-bookstore-owner/" },
    { title: "Longest Turbulent Subarray", url: "https://leetcode.com/problems/longest-turbulent-subarray/" },
  ],
  "Stack": [
    { title: "Decode String", url: "https://leetcode.com/problems/decode-string/" },
    { title: "Asteroid Collision", url: "https://leetcode.com/problems/asteroid-collision/" },
    { title: "Basic Calculator II", url: "https://leetcode.com/problems/basic-calculator-ii/" },
  ],
  "Binary Search": [
    { title: "First Bad Version", url: "https://leetcode.com/problems/first-bad-version/" },
    { title: "Capacity to Ship Packages Within D Days", url: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/" },
    { title: "Split Array Largest Sum", url: "https://leetcode.com/problems/split-array-largest-sum/" },
  ],
  "Linked List": [
    { title: "Odd Even Linked List", url: "https://leetcode.com/problems/odd-even-linked-list/" },
    { title: "Palindrome Linked List", url: "https://leetcode.com/problems/palindrome-linked-list/" },
    { title: "Swap Nodes in Pairs", url: "https://leetcode.com/problems/swap-nodes-in-pairs/" },
  ],
  "Trees": [
    { title: "Path Sum II", url: "https://leetcode.com/problems/path-sum-ii/" },
    { title: "Sum Root to Leaf Numbers", url: "https://leetcode.com/problems/sum-root-to-leaf-numbers/" },
    { title: "All Nodes Distance K in Binary Tree", url: "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/" },
    { title: "Flatten Binary Tree to Linked List", url: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/" },
  ],
  "Tries": [
    { title: "Replace Words", url: "https://leetcode.com/problems/replace-words/" },
    { title: "Longest Word in Dictionary", url: "https://leetcode.com/problems/longest-word-in-dictionary/" },
  ],
  "Heap / Priority Queue": [
    { title: "Reorganize String", url: "https://leetcode.com/problems/reorganize-string/" },
    { title: "Top K Frequent Words", url: "https://leetcode.com/problems/top-k-frequent-words/" },
    { title: "Smallest Range Covering Elements from K Lists", url: "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/" },
  ],
  "Backtracking": [
    { title: "Combination Sum III", url: "https://leetcode.com/problems/combination-sum-iii/" },
    { title: "Restore IP Addresses", url: "https://leetcode.com/problems/restore-ip-addresses/" },
    { title: "Beautiful Arrangement", url: "https://leetcode.com/problems/beautiful-arrangement/" },
  ],
  "Graphs": [
    { title: "Number of Provinces", url: "https://leetcode.com/problems/number-of-provinces/" },
    { title: "Shortest Path in Binary Matrix", url: "https://leetcode.com/problems/shortest-path-in-binary-matrix/" },
    { title: "01 Matrix", url: "https://leetcode.com/problems/01-matrix/" },
  ],
  "Advanced Graphs": [
    { title: "Critical Connections in a Network", url: "https://leetcode.com/problems/critical-connections-in-a-network/" },
    { title: "Path with Minimum Effort", url: "https://leetcode.com/problems/path-with-minimum-effort/" },
    { title: "Find the City with the Smallest Number of Neighbors", url: "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/" },
  ],
  "1-D Dynamic Programming": [
    { title: "Perfect Squares", url: "https://leetcode.com/problems/perfect-squares/" },
    { title: "Integer Break", url: "https://leetcode.com/problems/integer-break/" },
    { title: "Wiggle Subsequence", url: "https://leetcode.com/problems/wiggle-subsequence/" },
  ],
  "2-D Dynamic Programming": [
    { title: "Triangle", url: "https://leetcode.com/problems/triangle/" },
    { title: "Minimum Path Sum", url: "https://leetcode.com/problems/minimum-path-sum/" },
    { title: "Maximal Square", url: "https://leetcode.com/problems/maximal-square/" },
  ],
  "Greedy": [
    { title: "Assign Cookies", url: "https://leetcode.com/problems/assign-cookies/" },
    { title: "Queue Reconstruction by Height", url: "https://leetcode.com/problems/queue-reconstruction-by-height/" },
    { title: "Non-decreasing Array", url: "https://leetcode.com/problems/non-decreasing-array/" },
  ],
  "Intervals": [
    { title: "My Calendar I", url: "https://leetcode.com/problems/my-calendar-i/" },
    { title: "Remove Covered Intervals", url: "https://leetcode.com/problems/remove-covered-intervals/" },
    { title: "Video Stitching", url: "https://leetcode.com/problems/video-stitching/" },
  ],
  "Math & Geometry": [
    { title: "Count Primes", url: "https://leetcode.com/problems/count-primes/" },
    { title: "Excel Sheet Column Number", url: "https://leetcode.com/problems/excel-sheet-column-number/" },
    { title: "Factorial Trailing Zeroes", url: "https://leetcode.com/problems/factorial-trailing-zeroes/" },
  ],
  "Bit Manipulation": [
    { title: "Power of Two", url: "https://leetcode.com/problems/power-of-two/" },
    { title: "Bitwise AND of Numbers Range", url: "https://leetcode.com/problems/bitwise-and-of-numbers-range/" },
    { title: "XOR Queries of a Subarray", url: "https://leetcode.com/problems/xor-queries-of-a-subarray/" },
  ],
};
```

---

## Task 5: Create server/routes/solutions.js

**Files:**
- Create: `server/routes/solutions.js`

- [ ] **Step 1: Create server/routes/solutions.js**

```js
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readSolution, writeSolution, patchSolution, getAllSolutions } from '../lib/parseSolution.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(__dirname, '../../src/problems.json'), 'utf8'));
const client = new Anthropic();
const router = Router();

function todayString() {
  return new Date().toISOString().split('T')[0];
}

router.get('/problems', (req, res) => {
  const solutions = getAllSolutions();
  res.json(problems.map(p => ({
    ...p,
    solved: !!solutions[p.id],
    ...(solutions[p.id] || {}),
  })));
});

router.get('/solutions/:id', (req, res) => {
  const solution = readSolution(req.params.id);
  if (!solution) return res.status(404).json({ error: 'Not found' });
  res.json(solution);
});

router.post('/solutions/:id', async (req, res) => {
  const { id } = req.params;
  const problem = problems.find(p => p.id === id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const { language, code, difficulty, notes, learnings, timeComplexity, spaceComplexity } = req.body;

  let aiReview = 'Review unavailable.';
  let aiScore = null;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are reviewing a coding interview solution.

Problem: ${problem.title} (${problem.category}, LC ${problem.lcDifficulty})

User's solution:
${code}

User's complexity analysis:
- Time: ${timeComplexity || 'not provided'}
- Space: ${spaceComplexity || 'not provided'}

Return JSON with exactly two fields:
- "review": A direct, specific code review (3-5 sentences). Cover correctness, actual time and space complexity, whether the user's complexity analysis is correct or where it went wrong, and one concrete improvement suggestion.
- "score": An integer 1-10 rating of solution quality. 10 = optimal, clean, idiomatic. 1 = incorrect or brute force with no structure. Factor in correctness, efficiency, and code clarity.

Respond with only the JSON object, no markdown fences.`,
      }],
    });
    const parsed = JSON.parse(message.content[0].text);
    aiReview = parsed.review;
    aiScore = parsed.score;
  } catch (e) {
    console.error('Claude review failed:', e.message);
  }

  const date = todayString();
  writeSolution(id, problem.title, { language, code, difficulty, date, notes, learnings, timeComplexity, spaceComplexity, aiReview, aiScore });

  const solutions = getAllSolutions();
  const sameCategory = problems.filter(p => p.category === problem.category && p.id !== id);
  const sameDaySolved = sameCategory.find(p => solutions[p.id]?.date === date);
  const comparisonPrompt = sameDaySolved ? { problem: sameDaySolved.title } : null;

  res.json({ solution: readSolution(id), comparisonPrompt });
});

router.patch('/solutions/:id', (req, res) => {
  const updated = patchSolution(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export default router;
```

---

## Task 6: Create server/routes/potd.js and server/routes/weakAreas.js

**Files:**
- Create: `server/routes/potd.js`
- Create: `server/routes/weakAreas.js`

- [ ] **Step 1: Create server/routes/potd.js**

```js
import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAllSolutions } from '../lib/parseSolution.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(__dirname, '../../src/problems.json'), 'utf8'));
const router = Router();

router.get('/potd', (req, res) => {
  const solutions = getAllSolutions();
  const hardPool = problems.filter(p => (solutions[p.id]?.difficulty ?? 0) >= 4);

  if (hardPool.length === 0) {
    const unsolved = problems.filter(p => !solutions[p.id]);
    const fallback = unsolved[Math.floor(Math.random() * unsolved.length)] || problems[0];
    return res.json({ problem: fallback, solution: solutions[fallback.id] || null, isFromHardPool: false });
  }

  const start = new Date(new Date().getFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  const selected = hardPool[dayOfYear % hardPool.length];
  res.json({ problem: selected, solution: solutions[selected.id], isFromHardPool: true });
});

export default router;
```

- [ ] **Step 2: Create server/routes/weakAreas.js**

```js
import { Router } from 'express';
import { computeWeakAreas } from '../lib/scoring.js';
import { weakAreaSuggestions } from '../lib/weakAreaSuggestions.js';

const router = Router();

router.get('/weak-areas', (req, res) => {
  const weakAreas = computeWeakAreas();
  res.json(weakAreas.map(area => ({
    ...area,
    suggestions: weakAreaSuggestions[area.category] || [],
  })));
});

export default router;
```

---

## Task 7: Create server/index.js

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Create server/index.js**

```js
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import solutionsRouter from './routes/solutions.js';
import potdRouter from './routes/potd.js';
import weakAreasRouter from './routes/weakAreas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.use('/api', solutionsRouter);
app.use('/api', potdRouter);
app.use('/api', weakAreasRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
```

- [ ] **Step 2: Verify dev startup**

Run `npm run dev` and confirm both Vite (port 5173) and Express (port 3001) start without errors. Visit `http://localhost:5173` — the existing app should still load (prepdoc.jsx still exists at this point).

---

## Task 8: Rewrite src/App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace src/App.jsx**

```jsx
import { useState } from 'react'
import TodayTab from './TodayTab'
import ProblemsTab from './ProblemsTab'
import ProblemModal from './ProblemModal'
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  const [view, setView] = useState('today')
  const [modal, setModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOpenProblem = (id, problem) => setModal({ id, problem })

  const handleClose = (saved) => {
    if (saved) setRefreshKey(k => k + 1)
    setModal(null)
  }

  return (
    <>
      <Analytics />
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: '#F0EEF8',
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
        padding: '32px 24px',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[{ key: 'today', label: 'Today' }, { key: 'problems', label: 'Problems' }].map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)} style={{
              background: view === key ? '#FF4F9A' : '#1A1A1E',
              color: view === key ? '#fff' : '#888',
              border: 'none', borderRadius: 8, padding: '8px 16px',
              fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              fontWeight: 600, letterSpacing: 0.5, transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {view === 'today' && <TodayTab onOpenProblem={handleOpenProblem} refreshKey={refreshKey} />}
        {view === 'problems' && <ProblemsTab onOpenProblem={handleOpenProblem} refreshKey={refreshKey} />}

        {modal && (
          <ProblemModal
            id={modal.id}
            problem={modal.problem}
            onClose={handleClose}
          />
        )}
      </div>
    </>
  )
}
```

---

## Task 9: Create src/ProblemsTab.jsx

**Files:**
- Create: `src/ProblemsTab.jsx`

- [ ] **Step 1: Create src/ProblemsTab.jsx**

```jsx
import { useState, useEffect } from 'react'

const CATEGORY_ORDER = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack',
  'Binary Search', 'Linked List', 'Trees', 'Tries', 'Heap / Priority Queue',
  'Backtracking', 'Graphs', 'Advanced Graphs', '1-D Dynamic Programming',
  '2-D Dynamic Programming', 'Greedy', 'Intervals', 'Math & Geometry',
  'Bit Manipulation',
]

const LC_COLORS = { Easy: '#4CAF50', Medium: '#FF9800', Hard: '#F44336' }
const DIFF_COLORS = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#F44336']

export default function ProblemsTab({ onOpenProblem, refreshKey }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetch('/api/problems')
      .then(r => r.json())
      .then(data => { setProblems(data); setLoading(false) })
  }, [refreshKey])

  if (loading) return <div style={{ color: '#555', padding: 40, textAlign: 'center', fontSize: 13 }}>Loading...</div>

  const filtered = filter === 'solved' ? problems.filter(p => p.solved)
    : filter === 'unsolved' ? problems.filter(p => !p.solved)
    : problems

  const solvedCount = problems.filter(p => p.solved).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>NeetCode 150</div>
          <div style={{ fontSize: 13, color: '#888' }}>{solvedCount} / 150 solved</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'solved', 'unsolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#FF4F9A22' : 'transparent',
              color: filter === f ? '#FF4F9A' : '#555',
              border: `1px solid ${filter === f ? '#FF4F9A44' : '#2A2A32'}`,
              borderRadius: 6, padding: '4px 10px', fontSize: 11,
              fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {CATEGORY_ORDER.map(cat => {
        const catProblems = filtered.filter(p => p.category === cat)
        if (!catProblems.length) return null
        const catTotal = problems.filter(p => p.category === cat).length
        const catSolved = problems.filter(p => p.category === cat && p.solved).length
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              {cat} · {catSolved}/{catTotal}
            </div>
            <div style={{ background: '#13131A', borderRadius: 12, border: '1px solid #1E1E28', overflow: 'hidden' }}>
              {catProblems.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProblem(p.id, p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    borderBottom: i < catProblems.length - 1 ? '1px solid #1E1E28' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A1A22'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: p.solved ? (DIFF_COLORS[p.difficulty] || '#FF4F9A') : 'transparent',
                    border: p.solved ? 'none' : '1px solid #333',
                  }} />
                  <span style={{ fontSize: 13, color: p.solved ? '#777' : '#CCC', flex: 1 }}>{p.title}</span>
                  <span style={{ fontSize: 10, color: LC_COLORS[p.lcDifficulty], letterSpacing: 0.5 }}>{p.lcDifficulty}</span>
                  {p.aiScore != null && (
                    <span style={{ fontSize: 10, color: '#444' }}>AI {p.aiScore}/10</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

---

## Task 10: Create src/ProblemModal.jsx

**Files:**
- Create: `src/ProblemModal.jsx`

- [ ] **Step 1: Create src/ProblemModal.jsx**

```jsx
import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const codeTheme = {
  ...oneDark,
  'pre[class*="language-"]': { ...oneDark['pre[class*="language-"]'], background: 'transparent', margin: 0 },
  'code[class*="language-"]': { ...oneDark['code[class*="language-"]'], background: 'transparent' },
}

const DIFF_COLORS = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#F44336']
const DIFF_LABELS = ['', '1 – Easy', '2 – Manageable', '3 – Medium', '4 – Hard', '5 – Very Hard']

function Field({ label, value, onChange, multiline }) {
  const style = {
    width: '100%', background: '#0D0D12', border: '1px solid #2A2A32',
    borderRadius: 8, color: '#F0EEF8', fontFamily: "'DM Mono', 'Fira Mono', monospace",
    fontSize: 12, padding: '8px 12px', boxSizing: 'border-box', resize: 'vertical',
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {multiline
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} style={style} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ ...style, resize: undefined }} />
      }
    </div>
  )
}

export default function ProblemModal({ id, problem, onClose }) {
  const [solution, setSolution] = useState(null)
  const [mode, setMode] = useState('loading') // loading | edit | saving | comparison | view

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [difficulty, setDifficulty] = useState(3)
  const [notes, setNotes] = useState('')
  const [learnings, setLearnings] = useState('')
  const [timeComplexity, setTimeComplexity] = useState('')
  const [spaceComplexity, setSpaceComplexity] = useState('')
  const [comparisonPrompt, setComparisonPrompt] = useState(null)

  useEffect(() => {
    if (problem?.solved) {
      fetch(`/api/solutions/${id}`)
        .then(r => r.json())
        .then(sol => { setSolution(sol); setMode('view') })
    } else {
      setMode('edit')
    }
  }, [id])

  const handleSave = async () => {
    setMode('saving')
    const res = await fetch(`/api/solutions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, difficulty, notes, learnings, timeComplexity, spaceComplexity }),
    })
    const { solution: saved, comparisonPrompt: cp } = await res.json()
    setSolution(saved)
    setComparisonPrompt(cp)
    setMode(cp ? 'comparison' : 'view')
  }

  const handleComparison = async (result) => {
    await fetch(`/api/solutions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comparison: { problem: comparisonPrompt.problem, result } }),
    })
    setSolution(prev => ({ ...prev, comparison: { problem: comparisonPrompt.problem, result } }))
    setComparisonPrompt(null)
    setMode('view')
  }

  const handleEdit = () => {
    setCode(solution.code || '')
    setLanguage(solution.language || 'python')
    setDifficulty(solution.difficulty || 3)
    setNotes(solution.notes || '')
    setLearnings(solution.learnings || '')
    setTimeComplexity(solution.timeComplexity || '')
    setSpaceComplexity(solution.spaceComplexity || '')
    setMode('edit')
  }

  const overlayClick = (e) => {
    if (e.target === e.currentTarget) onClose(solution != null)
  }

  const modalStyle = {
    background: '#13131A', borderRadius: 16, border: '1px solid #2A2A32',
    width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', padding: 28,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={overlayClick}
    >
      <div style={modalStyle}>
        {/* Header */}
        {problem && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EEF8', marginBottom: 4 }}>{problem.title}</div>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>{problem.category} · LC {problem.lcDifficulty}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#FF4F9A', textDecoration: 'none' }}>
                LC ↗
              </a>
              <button onClick={() => onClose(solution != null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          </div>
        )}

        {mode === 'loading' && (
          <div style={{ color: '#555', textAlign: 'center', padding: 40, fontSize: 13 }}>Loading...</div>
        )}

        {mode === 'saving' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#FF4F9A', fontSize: 14, marginBottom: 8 }}>Getting AI review...</div>
            <div style={{ color: '#555', fontSize: 12 }}>This takes a few seconds</div>
          </div>
        )}

        {mode === 'edit' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Language</div>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                background: '#0D0D12', border: '1px solid #2A2A32', borderRadius: 8,
                color: '#F0EEF8', fontFamily: 'inherit', fontSize: 12, padding: '8px 12px',
              }}>
                {['python', 'javascript', 'typescript', 'java', 'cpp', 'go'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Code</div>
              <textarea
                rows={10}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Paste your solution here"
                style={{
                  width: '100%', background: '#0D0D12', border: '1px solid #2A2A32',
                  borderRadius: 8, color: '#F0EEF8', fontFamily: "'DM Mono', 'Fira Mono', monospace",
                  fontSize: 12, padding: '8px 12px', boxSizing: 'border-box', resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Difficulty — <span style={{ color: DIFF_COLORS[difficulty] }}>{DIFF_LABELS[difficulty]}</span>
              </div>
              <input type="range" min={1} max={5} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                style={{ width: '100%', accentColor: DIFF_COLORS[difficulty] }} />
            </div>

            <Field label="What do you think the time complexity is?" value={timeComplexity} onChange={setTimeComplexity} />
            <Field label="What do you think the space complexity is?" value={spaceComplexity} onChange={setSpaceComplexity} />
            <Field label="Notes" value={notes} onChange={setNotes} multiline />
            <Field label="Key Learning" value={learnings} onChange={setLearnings} multiline />

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={!code.trim()} style={{
                background: code.trim() ? '#FF4F9A' : '#2A2A32', color: code.trim() ? '#fff' : '#555',
                border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13,
                fontFamily: 'inherit', cursor: code.trim() ? 'pointer' : 'default', fontWeight: 600,
              }}>Save &amp; Get AI Review</button>
              <button onClick={() => solution ? setMode('view') : onClose(false)} style={{
                background: 'transparent', color: '#555', border: '1px solid #2A2A32',
                borderRadius: 8, padding: '10px 24px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}

        {mode === 'comparison' && comparisonPrompt && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 14, color: '#F0EEF8', marginBottom: 6 }}>Solution saved!</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
              Was this harder or easier than <strong style={{ color: '#F0EEF8' }}>{comparisonPrompt.problem}</strong>?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {['harder', 'easier'].map(r => (
                <button key={r} onClick={() => handleComparison(r)} style={{
                  background: '#FF4F9A22', color: '#FF4F9A', border: '1px solid #FF4F9A44',
                  borderRadius: 8, padding: '10px 24px', fontSize: 13,
                  fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
                }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
              ))}
              <button onClick={() => { setComparisonPrompt(null); setMode('view') }} style={{
                background: 'transparent', color: '#555', border: '1px solid #2A2A32',
                borderRadius: 8, padding: '10px 24px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>Skip</button>
            </div>
          </div>
        )}

        {mode === 'view' && solution && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {solution.difficulty && (
                <span style={{ background: DIFF_COLORS[solution.difficulty] + '22', color: DIFF_COLORS[solution.difficulty], fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${DIFF_COLORS[solution.difficulty]}44` }}>
                  Difficulty {solution.difficulty}/5
                </span>
              )}
              {solution.aiScore != null && (
                <span style={{ background: '#FF4F9A22', color: '#FF4F9A', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid #FF4F9A44' }}>
                  AI Score {solution.aiScore}/10
                </span>
              )}
              <button onClick={handleEdit} style={{
                marginLeft: 'auto', background: 'transparent', color: '#555', border: '1px solid #2A2A32',
                borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
              }}>Edit</button>
            </div>

            <div style={{ background: '#080810', borderRadius: 8, padding: 16, marginBottom: 16, overflow: 'auto' }}>
              <SyntaxHighlighter language={solution.language || 'python'} style={codeTheme} customStyle={{ fontSize: 12, margin: 0, padding: 0, fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
                {solution.code}
              </SyntaxHighlighter>
            </div>

            {(solution.timeComplexity || solution.spaceComplexity) && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                {solution.timeComplexity && <div style={{ fontSize: 12, color: '#888' }}>Time: <span style={{ color: '#CCC' }}>{solution.timeComplexity}</span></div>}
                {solution.spaceComplexity && <div style={{ fontSize: 12, color: '#888' }}>Space: <span style={{ color: '#CCC' }}>{solution.spaceComplexity}</span></div>}
              </div>
            )}

            {solution.aiReview && (
              <div style={{ background: '#0D0D12', borderLeft: '3px solid #FF4F9A', padding: '10px 14px', borderRadius: '0 6px 6px 0', marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>AI Review</div>
                <div style={{ fontSize: 12, color: '#AAA', lineHeight: 1.7 }}>{solution.aiReview}</div>
              </div>
            )}

            {solution.learnings && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Key Learning</div>
                <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.6 }}>{solution.learnings}</div>
              </div>
            )}

            {solution.notes && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{solution.notes}</div>
              </div>
            )}

            {solution.comparison && (
              <div style={{ fontSize: 12, color: '#555', marginTop: 12 }}>
                Felt <span style={{ color: '#888' }}>{solution.comparison.result}</span> than {solution.comparison.problem}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Task 11: Create src/TodayTab.jsx

**Files:**
- Create: `src/TodayTab.jsx`

- [ ] **Step 1: Create src/TodayTab.jsx**

```jsx
import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const codeTheme = {
  ...oneDark,
  'pre[class*="language-"]': { ...oneDark['pre[class*="language-"]'], background: 'transparent', margin: 0 },
  'code[class*="language-"]': { ...oneDark['code[class*="language-"]'], background: 'transparent' },
}

const DIFF_COLORS = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#F44336']

export default function TodayTab({ onOpenProblem, refreshKey }) {
  const [potd, setPotd] = useState(null)
  const [weakAreas, setWeakAreas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/potd').then(r => r.json()),
      fetch('/api/weak-areas').then(r => r.json()),
    ]).then(([potdData, weakData]) => {
      setPotd(potdData)
      setWeakAreas(weakData)
      setLoading(false)
    })
  }, [refreshKey])

  if (loading) return <div style={{ color: '#555', padding: 40, textAlign: 'center', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      {/* POTD */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          {potd?.isFromHardPool ? 'Problem of the Day — Hard Pool' : 'Problem of the Day — Suggested'}
        </div>

        {potd && (
          <div style={{ background: '#13131A', borderRadius: 16, padding: 24, border: '1px solid #2A2A32' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EEF8', marginBottom: 4 }}>{potd.problem.title}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{potd.problem.category} · LC {potd.problem.lcDifficulty}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={potd.problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#FF4F9A', textDecoration: 'none' }}>LC ↗</a>
                <button
                  onClick={() => onOpenProblem(potd.problem.id, { ...potd.problem, solved: !!potd.solution })}
                  style={{ background: '#FF4F9A22', color: '#FF4F9A', border: '1px solid #FF4F9A44', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  {potd.solution ? 'Re-solve' : 'Solve'}
                </button>
              </div>
            </div>

            {potd.solution && (
              <>
                {potd.solution.difficulty && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    <span style={{ background: DIFF_COLORS[potd.solution.difficulty] + '22', color: DIFF_COLORS[potd.solution.difficulty], fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${DIFF_COLORS[potd.solution.difficulty]}44` }}>
                      Difficulty {potd.solution.difficulty}/5
                    </span>
                    {potd.solution.aiScore != null && (
                      <span style={{ background: '#FF4F9A22', color: '#FF4F9A', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid #FF4F9A44' }}>
                        AI {potd.solution.aiScore}/10
                      </span>
                    )}
                  </div>
                )}

                <div style={{ background: '#080810', borderRadius: 8, padding: 16, marginBottom: 14, overflow: 'auto' }}>
                  <SyntaxHighlighter language={potd.solution.language || 'python'} style={codeTheme} customStyle={{ fontSize: 12, margin: 0, padding: 0, fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
                    {potd.solution.code}
                  </SyntaxHighlighter>
                </div>

                {potd.solution.aiReview && (
                  <div style={{ background: '#0D0D12', borderLeft: '3px solid #FF4F9A', padding: '10px 14px', borderRadius: '0 6px 6px 0', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>AI Review</div>
                    <div style={{ fontSize: 12, color: '#AAA', lineHeight: 1.7 }}>{potd.solution.aiReview}</div>
                  </div>
                )}

                {potd.solution.learnings && (
                  <div>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Key Learning</div>
                    <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.6 }}>{potd.solution.learnings}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            Weak Areas — Suggested Extra Practice
          </div>
          {weakAreas.map(area => (
            <div key={area.category} style={{ background: '#13131A', borderRadius: 12, padding: 20, border: '1px solid #1E1E28', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F0EEF8' }}>{area.category}</div>
                <span style={{ background: '#FF572222', color: '#FF5722', fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '1px solid #FF572244' }}>
                  Score {area.weightedScore}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {area.suggestions.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 12, color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#CCC'}
                    onMouseLeave={e => e.currentTarget.style.color = '#888'}
                  >
                    <span style={{ color: '#333' }}>→</span> {s.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!potd?.isFromHardPool && weakAreas.length === 0 && (
        <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: '40px 0', lineHeight: 1.8 }}>
          Solve more problems and rate them 4+ to start seeing your hard pool and weak areas here.
        </div>
      )}
    </div>
  )
}
```

---

## Task 12: Delete old files

**Files:**
- Delete: `src/PatternPage.jsx`
- Delete: `src/parsePatterns.js`
- Delete: `src/parsePatterns.test.js`
- Delete: `src/patterns.md`
- Delete: `src/prepdoc.jsx`

- [ ] **Step 1: Delete old source files**

```bash
rm src/PatternPage.jsx src/parsePatterns.js src/parsePatterns.test.js src/patterns.md src/prepdoc.jsx
```

- [ ] **Step 2: Verify the app builds and runs**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- Two tabs: Today and Problems
- Problems tab shows the full NeetCode 150 list grouped by category
- Clicking a problem opens the modal
- Existing solved problems (e.g. two_sum) appear with a colored dot
- Clicking an existing solved problem loads its code and shows the view mode
- Today tab shows POTD (will be a suggested unsolved problem until hard-pool problems exist)
- Saving a new solution triggers the Claude review loading state and renders the review on completion

---

## Notes

- The `ANTHROPIC_API_KEY` must be set in `.env` before saving solutions. Without it, the server logs a Claude error and stores `aiReview: 'Review unavailable.'`.
- Existing solved files without frontmatter (the 21 current files) load fine — `readSolution` treats missing frontmatter fields as empty/null.
- The `islands_and_treasures.md` file maps to the "Walls and Gates" problem in `problems.json` (id: `islands_and_treasures`). The title shown in the UI will be "Walls and Gates" but the file on disk retains its original name.
