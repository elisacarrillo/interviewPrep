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
