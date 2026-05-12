import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAllSolutionsAsync } from '../server/lib/solutionStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(__dirname, '../src/problems.json'), 'utf8'));

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const solutions = await getAllSolutionsAsync();
  res.json(problems.map(p => ({
    ...p,
    solved: !!solutions[p.id],
    ...(solutions[p.id] || {}),
  })));
}
