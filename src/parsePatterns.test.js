import { describe, it, expect } from 'vitest';
import { parsePatterns, slugify, parseSolvedProblem } from './parsePatterns';

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
