import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const codeTheme = {
  ...oneDark,
  'pre[class*="language-"]': { ...oneDark['pre[class*="language-"]'], background: 'transparent', margin: 0 },
  'code[class*="language-"]': { ...oneDark['code[class*="language-"]'], background: 'transparent' },
}

const DIFF_COLORS = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#F44336']
const DIFF_LABELS = ['', '1 – Easy', '2 – Manageable', '3 – Medium', '4 – Hard', '5 – Very Hard']

function Field({ label, value, onChange, multiline, placeholder }) {
  const base = {
    width: '100%', background: '#0D0D12', border: '1px solid #2A2A32',
    borderRadius: 8, color: '#F0EEF8', fontFamily: "'DM Mono', 'Fira Mono', monospace",
    fontSize: 12, padding: '8px 12px', boxSizing: 'border-box',
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {multiline
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize: 'vertical' }} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  )
}

export default function ProblemModal({ id, problem, onClose }) {
  const [solution, setSolution] = useState(null)
  const [mode, setMode] = useState('loading')

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [difficulty, setDifficulty] = useState(3)
  const [notes, setNotes] = useState('')
  const [learnings, setLearnings] = useState('')
  const [timeComplexity, setTimeComplexity] = useState('')
  const [spaceComplexity, setSpaceComplexity] = useState('')
  const [comparisonPrompt, setComparisonPrompt] = useState(null)

  useEffect(() => {
    if (problem?.solved) {
      fetch(`/api/solutions/${id}`)
        .then(r => r.json())
        .then(sol => { setSolution(sol); setMode('view') })
    } else {
      setMode('edit')
    }
  }, [id])

  const handleSave = async () => {
    setMode('saving')
    const res = await fetch(`/api/solutions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, difficulty, notes, learnings, timeComplexity, spaceComplexity }),
    })
    const { solution: saved, comparisonPrompt: cp } = await res.json()
    setSolution(saved)
    setComparisonPrompt(cp)
    setMode(cp ? 'comparison' : 'view')
  }

  const handleComparison = async (result) => {
    await fetch(`/api/solutions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comparison: { problem: comparisonPrompt.problem, result } }),
    })
    setSolution(prev => ({ ...prev, comparison: { problem: comparisonPrompt.problem, result } }))
    setComparisonPrompt(null)
    setMode('view')
  }

  const handleEdit = () => {
    setCode(solution.code || '')
    setLanguage(solution.language || 'python')
    setDifficulty(solution.difficulty || 3)
    setNotes(solution.notes || '')
    setLearnings(solution.learnings || '')
    setTimeComplexity(solution.timeComplexity || '')
    setSpaceComplexity(solution.spaceComplexity || '')
    setMode('edit')
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(solution != null) }}
    >
      <div style={{ background: '#13131A', borderRadius: 16, border: '1px solid #2A2A32', width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>

        {/* Header */}
        {problem && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EEF8', marginBottom: 4 }}>{problem.title}</div>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>{problem.category} · LC {problem.lcDifficulty}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#FF4F9A', textDecoration: 'none' }}>LC ↗</a>
              <button onClick={() => onClose(solution != null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          </div>
        )}

        {mode === 'loading' && (
          <div style={{ color: '#555', textAlign: 'center', padding: 40, fontSize: 13 }}>Loading...</div>
        )}

        {mode === 'saving' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#FF4F9A', fontSize: 14, marginBottom: 8 }}>Getting AI review...</div>
            <div style={{ color: '#555', fontSize: 12 }}>This takes a few seconds</div>
          </div>
        )}

        {mode === 'edit' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Language</div>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                background: '#0D0D12', border: '1px solid #2A2A32', borderRadius: 8,
                color: '#F0EEF8', fontFamily: 'inherit', fontSize: 12, padding: '8px 12px',
              }}>
                {['python', 'javascript', 'typescript', 'java', 'cpp', 'go'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Code</div>
              <textarea
                rows={10}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Paste your solution here"
                style={{
                  width: '100%', background: '#0D0D12', border: '1px solid #2A2A32',
                  borderRadius: 8, color: '#F0EEF8', fontFamily: "'DM Mono', 'Fira Mono', monospace",
                  fontSize: 12, padding: '8px 12px', boxSizing: 'border-box', resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Difficulty — <span style={{ color: DIFF_COLORS[difficulty] }}>{DIFF_LABELS[difficulty]}</span>
              </div>
              <input type="range" min={1} max={5} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                style={{ width: '100%', accentColor: DIFF_COLORS[difficulty] }} />
            </div>

            <Field label="What do you think the time complexity is?" value={timeComplexity} onChange={setTimeComplexity} placeholder="e.g. O(n log n)" />
            <Field label="What do you think the space complexity is?" value={spaceComplexity} onChange={setSpaceComplexity} placeholder="e.g. O(n)" />
            <Field label="Notes" value={notes} onChange={setNotes} multiline placeholder="Any thoughts while solving..." />
            <Field label="Key Learning" value={learnings} onChange={setLearnings} multiline placeholder="What's the takeaway?" />

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={!code.trim()} style={{
                background: code.trim() ? '#FF4F9A' : '#2A2A32',
                color: code.trim() ? '#fff' : '#555',
                border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13,
                fontFamily: 'inherit', cursor: code.trim() ? 'pointer' : 'default', fontWeight: 600,
              }}>Save &amp; Get AI Review</button>
              <button onClick={() => solution ? setMode('view') : onClose(false)} style={{
                background: 'transparent', color: '#555', border: '1px solid #2A2A32',
                borderRadius: 8, padding: '10px 24px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}

        {mode === 'comparison' && comparisonPrompt && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 14, color: '#F0EEF8', marginBottom: 6 }}>Solution saved!</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
              Was this harder or easier than <strong style={{ color: '#F0EEF8' }}>{comparisonPrompt.problem}</strong>?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {['harder', 'easier'].map(r => (
                <button key={r} onClick={() => handleComparison(r)} style={{
                  background: '#FF4F9A22', color: '#FF4F9A', border: '1px solid #FF4F9A44',
                  borderRadius: 8, padding: '10px 24px', fontSize: 13,
                  fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
                }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
              ))}
              <button onClick={() => { setComparisonPrompt(null); setMode('view') }} style={{
                background: 'transparent', color: '#555', border: '1px solid #2A2A32',
                borderRadius: 8, padding: '10px 24px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              }}>Skip</button>
            </div>
          </div>
        )}

        {mode === 'view' && solution && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {solution.difficulty && (
                <span style={{ background: DIFF_COLORS[solution.difficulty] + '22', color: DIFF_COLORS[solution.difficulty], fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${DIFF_COLORS[solution.difficulty]}44` }}>
                  Difficulty {solution.difficulty}/5
                </span>
              )}
              {solution.aiScore != null && (
                <span style={{ background: '#FF4F9A22', color: '#FF4F9A', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid #FF4F9A44' }}>
                  AI Score {solution.aiScore}/10
                </span>
              )}
              <button onClick={handleEdit} style={{
                marginLeft: 'auto', background: 'transparent', color: '#555', border: '1px solid #2A2A32',
                borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
              }}>Edit</button>
            </div>

            <div style={{ background: '#080810', borderRadius: 8, padding: 16, marginBottom: 16, overflow: 'auto' }}>
              <SyntaxHighlighter language={solution.language || 'python'} style={codeTheme} customStyle={{ fontSize: 12, margin: 0, padding: 0, fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
                {solution.code || ''}
              </SyntaxHighlighter>
            </div>

            {(solution.timeComplexity || solution.spaceComplexity) && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 20 }}>
                {solution.timeComplexity && <div style={{ fontSize: 12, color: '#888' }}>Time: <span style={{ color: '#CCC' }}>{solution.timeComplexity}</span></div>}
                {solution.spaceComplexity && <div style={{ fontSize: 12, color: '#888' }}>Space: <span style={{ color: '#CCC' }}>{solution.spaceComplexity}</span></div>}
              </div>
            )}

            {solution.aiReview && (
              <div style={{ background: '#0D0D12', borderLeft: '3px solid #FF4F9A', padding: '10px 14px', borderRadius: '0 6px 6px 0', marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>AI Review</div>
                <div style={{ fontSize: 12, color: '#AAA', lineHeight: 1.7 }}>{solution.aiReview}</div>
              </div>
            )}

            {solution.learnings && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Key Learning</div>
                <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.6 }}>{solution.learnings}</div>
              </div>
            )}

            {solution.notes && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{solution.notes}</div>
              </div>
            )}

            {solution.comparison && (
              <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
                Felt <span style={{ color: '#888' }}>{solution.comparison.result}</span> than {solution.comparison.problem}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
