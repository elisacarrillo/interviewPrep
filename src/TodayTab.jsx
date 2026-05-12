import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const codeTheme = {
  ...oneDark,
  'pre[class*="language-"]': { ...oneDark['pre[class*="language-"]'], background: 'transparent', margin: 0 },
  'code[class*="language-"]': { ...oneDark['code[class*="language-"]'], background: 'transparent' },
}

const DIFF_COLORS = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#F44336']
const LC_COLORS = { Easy: '#4CAF50', Medium: '#FF9800', Hard: '#F44336' }

export default function TodayTab({ onOpenProblem, refreshKey }) {
  const [potd, setPotd] = useState(null)
  const [weakAreas, setWeakAreas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/potd').then(r => r.json()),
      fetch('/api/weak-areas').then(r => r.json()),
    ]).then(([potdData, weakData]) => {
      setPotd(potdData)
      setWeakAreas(weakData)
      setLoading(false)
    })
  }, [refreshKey])

  if (loading) return <div style={{ color: '#555', padding: 40, textAlign: 'center', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      {/* POTD */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Problem of the Day — {potd?.isFromHardPool ? 'Hard Pool' : 'Suggested'}
        </div>

        {potd?.problem ? (
          <div style={{ background: '#13131A', borderRadius: 12, border: '1px solid #1E1E28', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EEF8', marginBottom: 4 }}>{potd.problem.title}</div>
                <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>
                  {potd.problem.category} ·{' '}
                  <span style={{ color: LC_COLORS[potd.problem.lcDifficulty] }}>{potd.problem.lcDifficulty}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <a href={potd.problem.leetcodeUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#FF4F9A', textDecoration: 'none' }}>LC ↗</a>
                <button
                  onClick={() => onOpenProblem(potd.problem.id, potd.problem)}
                  style={{
                    background: '#FF4F9A', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '6px 16px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {potd.solution?.solved ? 'Re-solve' : 'Solve'}
                </button>
              </div>
            </div>

            {potd.solution?.solved && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {potd.solution.difficulty && (
                    <span style={{
                      background: DIFF_COLORS[potd.solution.difficulty] + '22',
                      color: DIFF_COLORS[potd.solution.difficulty],
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      border: `1px solid ${DIFF_COLORS[potd.solution.difficulty]}44`,
                    }}>
                      Difficulty {potd.solution.difficulty}/5
                    </span>
                  )}
                  {potd.solution.aiScore != null && (
                    <span style={{
                      background: '#FF4F9A22', color: '#FF4F9A', fontSize: 11,
                      padding: '3px 10px', borderRadius: 20, border: '1px solid #FF4F9A44',
                    }}>
                      AI Score {potd.solution.aiScore}/10
                    </span>
                  )}
                </div>

                {potd.solution.code && (
                  <div style={{ background: '#080810', borderRadius: 8, padding: 16, marginBottom: 12, overflow: 'auto' }}>
                    <SyntaxHighlighter
                      language={potd.solution.language || 'python'}
                      style={codeTheme}
                      customStyle={{ fontSize: 12, margin: 0, padding: 0, fontFamily: "'DM Mono', 'Fira Mono', monospace" }}
                    >
                      {potd.solution.code}
                    </SyntaxHighlighter>
                  </div>
                )}

                {potd.solution.aiReview && (
                  <div style={{
                    background: '#0D0D12', borderLeft: '3px solid #FF4F9A',
                    padding: '10px 14px', borderRadius: '0 6px 6px 0', marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>AI Review</div>
                    <div style={{ fontSize: 12, color: '#AAA', lineHeight: 1.7 }}>{potd.solution.aiReview}</div>
                  </div>
                )}

                {potd.solution.learnings && (
                  <div>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Key Learning</div>
                    <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.6 }}>{potd.solution.learnings}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#555', fontSize: 13, padding: 20, background: '#13131A', borderRadius: 12, border: '1px solid #1E1E28' }}>
            No problems in the hard pool yet. Solve more problems and rate them 4–5 to populate POTD.
          </div>
        )}

        {/* Extra daily problems */}
        {potd?.extras?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Also Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {potd.extras.map(({ problem: p, solution: s }) => (
                <div
                  key={p.id}
                  style={{ background: '#13131A', borderRadius: 10, border: '1px solid #1E1E28', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: s?.solved ? (DIFF_COLORS[s.difficulty] || '#FF4F9A') : 'transparent',
                    border: s?.solved ? 'none' : '1px solid #333',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: s?.solved ? '#777' : '#CCC', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 10, color: '#444', letterSpacing: 0.5 }}>{p.category}</div>
                  </div>
                  <span style={{ fontSize: 10, color: LC_COLORS[p.lcDifficulty] }}>{p.lcDifficulty}</span>
                  {s?.aiScore != null && <span style={{ fontSize: 10, color: '#444' }}>AI {s.aiScore}/10</span>}
                  <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#555', textDecoration: 'none' }}>LC ↗</a>
                  <button
                    onClick={() => onOpenProblem(p.id, p)}
                    style={{
                      background: 'transparent', color: '#FF4F9A', border: '1px solid #FF4F9A44',
                      borderRadius: 6, padding: '4px 12px', fontSize: 11,
                      fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    {s?.solved ? 'Review' : 'Solve'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            Weak Areas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weakAreas.map(area => (
              <div key={area.category} style={{ background: '#13131A', borderRadius: 12, border: '1px solid #1E1E28', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: area.suggestions?.length ? 12 : 0 }}>
                  <span style={{ fontSize: 13, color: '#CCC', fontWeight: 600 }}>{area.category}</span>
                  <span style={{
                    background: '#FF5722' + '22', color: '#FF5722', fontSize: 10,
                    padding: '2px 8px', borderRadius: 20, border: '1px solid #FF572244',
                  }}>
                    score {area.weightedScore.toFixed(1)}
                  </span>
                </div>
                {area.suggestions?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                      Extra Practice
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {area.suggestions.map(s => (
                        <a
                          key={s.title}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: '#FF4F9A', textDecoration: 'none' }}
                        >
                          {s.title} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
