import { useState } from "react";
import PatternPage from "./PatternPage";
import { parsePatterns, parseSolvedProblem } from "./parsePatterns";
import patternsRaw from "./patterns.md?raw";

const parsedPatterns = parsePatterns(patternsRaw);

const rawFiles = import.meta.glob('../docs/completed_problems/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const solvedProblems = Object.entries(rawFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, raw]) => parseSolvedProblem(raw));

const solvedTitles = new Set(solvedProblems.map(p => p.title.toLowerCase().trim()));

const plan = {
  phases: [
    {
      id: 1,
      label: "Phase 1",
      title: "Foundation Sweep",
      duration: "Days 1–3",
      color: "#FF4F9A",
      accent: "#FFE5F2",
      goal: "Refresh core data structures. Don't re-learn from scratch — you know this. Just reconnect.",
      topics: [
        {
          ds: "Arrays & Hash Maps",
          patterns: ["Two Pointers", "Sliding Window", "Frequency Count"],
          problems: ["Two Sum", "Contains Duplicate", "Longest Substring Without Repeating Characters"],
          tip: "Hash maps are your first instinct for O(1) lookup. Almost every 'find a pair' problem uses one."
        },
        {
          ds: "Stacks & Queues",
          patterns: ["Monotonic Stack", "BFS with Queue"],
          problems: ["Valid Parentheses", "Min Stack", "Number of Islands (BFS)"],
          tip: "Stacks = last-in-first-out context. Queues = level-by-level processing."
        },
        {
          ds: "Trees",
          patterns: ["DFS (recursive)", "BFS (iterative)", "In/Pre/Post-order"],
          problems: ["Maximum Depth of Binary Tree", "Invert Binary Tree", "Level Order Traversal"],
          tip: "Write the recursive base case first. 'What happens at null?' is always your anchor."
        }
      ]
    },
    {
      id: 2,
      label: "Phase 2",
      title: "Pattern Mastery",
      duration: "Days 4–7",
      color: "#FF85C2",
      accent: "#FFF0F8",
      goal: "Build pattern recognition. When you see a problem, you should immediately think: 'this smells like a sliding window.'",
      topics: [
        {
          ds: "Heaps / Priority Queues",
          patterns: ["Top K Elements", "Merge K Sorted", "Running Median"],
          problems: ["Kth Largest Element", "Top K Frequent Elements", "Find Median from Data Stream"],
          tip: "Heap = when you repeatedly need the min or max. If K appears in the problem, think heap."
        },
        {
          ds: "Graph Traversal",
          patterns: ["DFS", "BFS", "Union-Find", "Topological Sort"],
          problems: ["Clone Graph", "Course Schedule", "Pacific Atlantic Water Flow"],
          tip: "Always ask: directed or undirected? Cyclic or acyclic? That narrows your approach fast."
        },
        {
          ds: "Recursion & Backtracking",
          patterns: ["Subsets", "Permutations", "Tree of choices"],
          problems: ["Subsets", "Permutations", "Word Search"],
          tip: "Backtracking = DFS on a decision tree. Draw the tree before coding — it makes the recursion obvious."
        }
      ]
    },
    {
      id: 3,
      label: "Phase 3",
      title: "Communication Drills",
      duration: "Days 8–10",
      color: "#E8007A",
      accent: "#FFE0F2",
      goal: "Partiful explicitly values how you think out loud. This phase is about talking while coding.",
      topics: [
        {
          ds: "Mock Interview Reps",
          patterns: ["Clarify constraints first", "Brute force → optimize", "Test with examples"],
          problems: ["Pick 2 random mediums from phases 1–2 and do them timed (25 min each)"],
          tip: "Say 'I'm going to start with brute force to make sure I understand the problem' — this is always correct."
        },
        {
          ds: "Edge Case Scripting",
          patterns: ["Empty input", "Single element", "All duplicates", "Negative numbers"],
          problems: ["Revisit any problem you got wrong — explain why your first instinct failed"],
          tip: "Before you code, list 3 edge cases out loud. It shows rigor and catches bugs early."
        },
        {
          ds: "Complexity Fluency",
          patterns: ["Know your Big-O before you submit", "Space vs Time trade-offs"],
          problems: ["For every problem solved this week: state time + space complexity unprompted"],
          tip: "They'll ask 'can you do better?' Have an answer ready. If not, say 'I'd explore a heap or hash map to reduce from O(n²)' — show the thought."
        }
      ]
    }
  ],
  partifulTips: [
    "They value collaboration — treat the interviewer as a teammate, not an examiner. Ask 'does this approach make sense to you?'",
    "Their hint: 'avoid solutions with lots of edge cases.' This means if your solution is getting complicated, step back and look for the elegant pattern.",
    "You can look up native APIs! Use this. If you forget a method name, just say 'let me quickly check the API' — it's allowed and shows self-awareness.",
    "Partiful is a social/events app — they likely value clean readable code over hyper-optimized code. Name your variables well.",
    "You came from Snap shipping to 375M users. That systems instinct is an asset. Connect your solutions to real-world scale when it's natural."
  ]
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
    <path d="M4.5 8L7 10.5L11.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function StudyPlan() {
  const [activePhase, setActivePhase] = useState(0);
  const [checked, setChecked] = useState({});
  const [showTips, setShowTips] = useState(false);
  const [view, setView] = useState('plan');
  const [activePatternKey, setActivePatternKey] = useState(null);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const phase = plan.phases[activePhase];

  const allProblems = plan.phases.flatMap((ph, phi) =>
    ph.topics.flatMap((t, ti) =>
      t.problems.map((prob, pi) => ({ prob, key: `${phi}-${ti}-${pi}` }))
    )
  );
  const totalProblems = allProblems.length;
  const doneCount = allProblems.filter(({ prob, key }) =>
    checked[key] || solvedTitles.has(prob.toLowerCase().trim())
  ).length;
  const pct = Math.round((doneCount / totalProblems) * 100);

  if (view === 'pattern' && activePatternKey) {
    const activePhaseData = plan.phases[activePatternKey.phaseIndex];
    const activeTopic = activePhaseData.topics[activePatternKey.topicIndex];

    const flatPatterns = activePhaseData.topics.flatMap((t, ti) =>
      t.patterns.map((p) => ({
        patternName: p,
        phaseIndex: activePatternKey.phaseIndex,
        topicIndex: ti,
      }))
    );
    const currentIdx = flatPatterns.findIndex(
      (p) => p.patternName === activePatternKey.patternName
    );
    const prevPattern = currentIdx > 0 ? flatPatterns[currentIdx - 1] : null;
    const nextPattern =
      currentIdx < flatPatterns.length - 1 ? flatPatterns[currentIdx + 1] : null;

    const patternData =
      parsedPatterns.find((p) => p.name === activePatternKey.patternName) || null;

    const relatedProblems = [];
    plan.phases.forEach((ph) => {
      ph.topics.forEach((t) => {
        if (t.patterns.includes(activePatternKey.patternName)) {
          relatedProblems.push(...t.problems);
        }
      });
    });

    return (
      <PatternPage
        patternData={patternData}
        phaseColor={activePhaseData.color}
        phaseLabel={activePhaseData.label}
        topicName={activeTopic.ds}
        onBack={() => setView('plan')}
        prevPattern={prevPattern}
        nextPattern={nextPattern}
        onNavigate={(key) => setActivePatternKey(key)}
        relatedProblems={relatedProblems}
        solvedTitles={solvedTitles}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      background: "#0D0D0F",
      color: "#F0EEF8",
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      padding: "32px 24px",
      boxSizing: "border-box"
    }}>
      {/* Top-level nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[
          { key: 'plan', label: 'Study Plan' },
          { key: 'solved', label: 'Solved Problems' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              background: view === key ? '#FF4F9A' : '#1A1A1E',
              color: view === key ? '#fff' : '#888',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'solved' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {solvedProblems.length === 0 ? (
            <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 40 }}>
              No solved problems yet.
            </div>
          ) : (
            solvedProblems.map(({ title, language, code }, i) => (
              <div key={i} style={{ background: '#13131A', borderRadius: 12, padding: '20px', border: '1px solid #1E1E28' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#F0EEF8' }}>{title}</span>
                  {language && (
                    <span style={{
                      background: '#FF4F9A22',
                      color: '#FF4F9A',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 20,
                      border: '1px solid #FF4F9A33',
                    }}>{language}</span>
                  )}
                </div>
                <pre style={{
                  background: '#0D0D12',
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 12,
                  color: '#CCC',
                  overflowX: 'auto',
                  fontFamily: 'inherit',
                  margin: 0,
                }}>
                  <code>{code}</code>
                </pre>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase", marginBottom: 8 }}>
              Partiful Interview Prep
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "'DM Serif Display', Georgia, serif", lineHeight: 1.1 }}>
              10-Day Study Plan
            </h1>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 4, background: "#1E1E22", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #E8007A, #FF85C2)", borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{doneCount}/{totalProblems} done</span>
            </div>
          </div>

          {/* Phase tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {plan.phases.map((p, i) => (
              <button key={i} onClick={() => setActivePhase(i)} style={{
                background: activePhase === i ? p.color : "#1A1A1E",
                color: activePhase === i ? "#fff" : "#888",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontFamily: "inherit",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s",
                letterSpacing: 0.5
              }}>
                {p.label} · {p.duration}
              </button>
            ))}
          </div>

          {/* Phase card */}
          <div style={{ background: "#13131A", borderRadius: 16, padding: "24px", marginBottom: 20, border: `1px solid ${phase.color}22` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Serif Display', Georgia, serif", color: phase.color }}>{phase.title}</span>
              <span style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>{phase.duration}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#AAA", lineHeight: 1.6 }}>{phase.goal}</p>
          </div>

          {/* Topics */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {phase.topics.map((topic, ti) => (
              <div key={ti} style={{ background: "#13131A", borderRadius: 12, padding: "20px", border: "1px solid #1E1E28" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#F0EEF8", marginBottom: 12 }}>
                  {topic.ds}
                </div>

                {/* Patterns */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 6 }}>Patterns</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {topic.patterns.map((p, pi) => (
                      <span
                        key={pi}
                        onClick={() => {
                          setActivePatternKey({ phaseIndex: activePhase, topicIndex: ti, patternName: p });
                          setView('pattern');
                        }}
                        style={{
                          background: phase.accent + "22",
                          color: phase.color,
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 20,
                          border: `1px solid ${phase.color}33`,
                          cursor: 'pointer',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >{p}</span>
                    ))}
                  </div>
                </div>

                {/* Problems */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 8 }}>Problems</div>
                  {topic.problems.map((prob, pi) => {
                    const key = `${activePhase}-${ti}-${pi}`;
                    const done = checked[key] || solvedTitles.has(prob.toLowerCase().trim());
                    return (
                      <div key={pi} onClick={() => toggle(key)} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "7px 0", cursor: "pointer",
                        borderBottom: pi < topic.problems.length - 1 ? "1px solid #1E1E28" : "none"
                      }}>
                        <span style={{ color: done ? phase.color : "#333", flexShrink: 0 }}><CheckIcon /></span>
                        <span style={{
                          fontSize: 13,
                          color: done ? "#555" : "#CCC",
                          textDecoration: done ? "line-through" : "none",
                          transition: "all 0.2s"
                        }}>{prob}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Tip */}
                <div style={{
                  background: "#0D0D12",
                  borderLeft: `3px solid ${phase.color}`,
                  padding: "10px 14px",
                  borderRadius: "0 6px 6px 0",
                  fontSize: 12,
                  color: "#888",
                  lineHeight: 1.6
                }}>
                  💡 {topic.tip}
                </div>
              </div>
            ))}
          </div>

          {/* Partiful-specific tips */}
          <button onClick={() => setShowTips(!showTips)} style={{
            width: "100%",
            background: showTips ? "#1A1A1E" : "#1A1A1E",
            border: "1px solid #2A2A32",
            borderRadius: 12,
            padding: "14px 20px",
            color: "#F0EEF8",
            fontFamily: "inherit",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showTips ? 0 : 0
          }}>
            <span>🎉 Partiful-Specific Tips</span>
            <span style={{ color: "#666" }}>{showTips ? "▲" : "▼"}</span>
          </button>
          {showTips && (
            <div style={{ background: "#13131A", border: "1px solid #2A2A32", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "20px" }}>
              {plan.partifulTips.map((tip, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, paddingBottom: 14,
                  borderBottom: i < plan.partifulTips.length - 1 ? "1px solid #1E1E28" : "none",
                  marginBottom: 14
                }}>
                  <span style={{ color: "#FF4F9A", fontSize: 13, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: 13, color: "#AAA", lineHeight: 1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}