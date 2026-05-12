import { getAllSolutionsAsync } from '../server/lib/solutionStore.js';
import { computeWeakAreas } from '../server/lib/scoring.js';
import { weakAreaSuggestions } from '../server/lib/weakAreaSuggestions.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const solutions = await getAllSolutionsAsync();
  const weakAreas = computeWeakAreas(solutions);
  res.json(weakAreas.map(area => ({
    ...area,
    suggestions: weakAreaSuggestions[area.category] || [],
  })));
}
