import { useState, useEffect, useRef } from 'react';
import { slugify } from './parsePatterns';

const DEMO = ['a', 'b', 'c', 'd', 'e'];

function StepDiagram({ steps, color }) {
  return (
    <div style={{ background: '#13131A', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #1E1E28' }}>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>How it moves</div>
      {steps.map((step, si) => (
        <div key={si} style={{ marginBottom: si < steps.length - 1 ? 16 : 0 }}>
          <div style={{ fontSize: 11, color: color + 'CC', marginBottom: step.window ? 8 : 0, lineHeight: 1.5 }}>
            {step.label}
          </div>
          {step.window && (
            <div style={{ display: 'flex', gap: 4 }}>
              {DEMO.map((el, i) => {
                const [l, r] = step.window;
                const inWindow = i >= l && i <= r;
                const dropped = i < l;
                return (
                  <div key={i} style={{
                    width: 30, height: 30,
                    background: inWindow ? color + '33' : '#1E1E28',
                    border: inWindow
                      ? `1.5px solid ${color}`
                      : dropped
                        ? '1.5px dashed #333'
                        : '1.5px solid transparent',
                    borderRadius: 4,
                    fontSize: 11,
                    color: inWindow ? color : dropped ? '#333' : '#444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: inWindow ? 700 : 400,
                  }}>{el}</div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <div style={{ background: '#13131A', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #1E1E28' }}>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Code shape</div>
      <div style={{ fontSize: 12, lineHeight: 1.9, whiteSpace: 'pre', fontFamily: 'inherit', overflowX: 'auto' }}>
        {code.split('\n').map((line, i) => (
          <div key={i} style={{ color: line.trim().startsWith('#') ? '#555' : '#AAA' }}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function NotesSection({ patternName }) {
  const key = `pattern-notes-${slugify(patternName)}`;
  const [notes, setNotes] = useState(() => localStorage.getItem(key) || '');
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => localStorage.setItem(key, val), 500);
  };

  return (
    <div style={{ background: '#13131A', borderRadius: 10, padding: 16, border: '1px solid #1E1E28' }}>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Your notes</div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Add your own notes, mnemonics, or insights..."
        style={{
          width: '100%',
          minHeight: 80,
          background: '#0D0D0F',
          border: '1px solid #2A2A32',
          borderRadius: 6,
          padding: '10px 12px',
          color: '#AAA',
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: 9, color: '#444', marginTop: 6 }}>saved automatically</div>
    </div>
  );
}

export default function PatternPage({
  patternData,
  phaseColor,
  phaseLabel,
  topicName,
  onBack,
  prevPattern,
  nextPattern,
  onNavigate,
  relatedProblems,
  solvedTitles = new Set(),
}) {
  const navBtn = {
    background: 'none', border: 'none', color: '#555', fontSize: 11,
    cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  };

  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      background: '#0D0D0F',
      color: '#F0EEF8',
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      boxSizing: 'border-box',
    }}>
      {/* Nav bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', borderBottom: '1px solid #1E1E28',
      }}>
        <button onClick={onBack} style={{ ...navBtn, color: '#666', fontSize: 12 }}>
          ← Back to study plan
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          {prevPattern && (
            <button onClick={() => onNavigate(prevPattern)} style={navBtn}>
              ← {prevPattern.patternName}
            </button>
          )}
          {nextPattern && (
            <button onClick={() => onNavigate(nextPattern)} style={navBtn}>
              {nextPattern.patternName} →
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            {phaseLabel} · {topicName}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: phaseColor, lineHeight: 1.1 }}>
            {patternData ? patternData.name : 'Pattern'}
          </div>
        </div>

        {!patternData ? (
          <p style={{ color: '#555', fontSize: 13 }}>Details for this pattern coming soon.</p>
        ) : (
          <>
            {patternData.steps.length > 0 && (
              <StepDiagram steps={patternData.steps} color={phaseColor} />
            )}

            {patternData.code && (
              <CodeBlock code={patternData.code} />
            )}

            {patternData.tip && (
              <div style={{
                borderLeft: '3px solid #FF4F9A',
                padding: '10px 14px',
                borderRadius: '0 6px 6px 0',
                fontSize: 12, color: '#888', lineHeight: 1.6,
                background: '#0D0D12', marginBottom: 14,
              }}>
                💡 {patternData.tip}
              </div>
            )}

            {relatedProblems.length > 0 && (
              <div style={{ background: '#13131A', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #1E1E28' }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                  Related Problems
                </div>
                {relatedProblems.map((p, i) => {
                  const solved = solvedTitles.has(p.toLowerCase().trim());
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 12, padding: '5px 0',
                      borderBottom: i < relatedProblems.length - 1 ? '1px solid #1E1E28' : 'none',
                    }}>
                      <span style={{ color: solved ? phaseColor : '#333', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
                          <path d="M4.5 8L7 10.5L11.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span style={{
                        color: solved ? '#555' : '#888',
                        textDecoration: solved ? 'line-through' : 'none',
                      }}>{p}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <NotesSection patternName={patternData.name} />
          </>
        )}
      </div>
    </div>
  );
}
