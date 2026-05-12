import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAllSolutionsAsync } from '../server/lib/solutionStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(__dirname, '../src/problems.json'), 'utf8'));

function seededSample(arr, n, seed) {
  const copy = [...arr];
  let s = seed | 0;
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    s = Math.imul(s, 1664525) + 1013904223;
    const idx = Math.abs(s) % copy.length;
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const solutions = await getAllSolutionsAsync();
  const start = new Date(new Date().getFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);

  const hardPool = problems.filter(p => (solutions[p.id]?.difficulty ?? 0) >= 4);
  let selected, isFromHardPool;

  if (hardPool.length === 0) {
    const unsolved = problems.filter(p => !solutions[p.id]);
    const pool = unsolved.length > 0 ? unsolved : problems;
    selected = seededSample(pool, 1, dayOfYear)[0];
    isFromHardPool = false;
  } else {
    selected = hardPool[dayOfYear % hardPool.length];
    isFromHardPool = true;
  }

  const remaining = problems.filter(p => p.id !== selected.id);
  const extras = seededSample(remaining, 3, dayOfYear + 1).map(p => ({
    problem: p,
    solution: solutions[p.id] || null,
  }));

  res.json({
    problem: selected,
    solution: solutions[selected.id] || null,
    isFromHardPool,
    extras,
  });
}
