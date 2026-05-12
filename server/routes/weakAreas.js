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
