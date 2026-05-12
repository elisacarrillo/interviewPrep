import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { getSolutionAsync, saveSolutionAsync, patchSolutionAsync, getAllSolutionsAsync } from '../../server/lib/solutionStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(__dirname, '../../src/problems.json'), 'utf8'));
const client = new Anthropic();

function todayString() {
  return new Date().toISOString().split('T')[0];
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const solution = await getSolutionAsync(id);
    if (!solution) return res.status(404).json({ error: 'Not found' });
    return res.json(solution);
  }

  if (req.method === 'POST') {
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
    const solution = await saveSolutionAsync(id, problem.title, {
      language, code, difficulty, date, notes, learnings,
      timeComplexity, spaceComplexity, aiReview, aiScore,
    });

    const solutions = await getAllSolutionsAsync();
    const sameCategory = problems.filter(p => p.category === problem.category && p.id !== id);
    const sameDaySolved = sameCategory.find(p => solutions[p.id]?.date === date);
    const comparisonPrompt = sameDaySolved ? { problem: sameDaySolved.title } : null;

    return res.json({ solution, comparisonPrompt });
  }

  if (req.method === 'PATCH') {
    const updated = await patchSolutionAsync(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  }

  res.status(405).end();
}
