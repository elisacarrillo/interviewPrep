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
