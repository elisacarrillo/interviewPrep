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
