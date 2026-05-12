import { useState, useEffect } from 'react'

const CATEGORY_ORDER = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack',
  'Binary Search', 'Linked List', 'Trees', 'Tries', 'Heap / Priority Queue',
  'Backtracking', 'Graphs', 'Advanced Graphs', '1-D Dynamic Programming',
  '2-D Dynamic Programming', 'Greedy', 'Intervals', 'Math & Geometry',
  'Bit Manipulation',
]

const LC_COLORS = { Easy: '#4CAF50', Medium: '#FF9800', Hard: '#F44336' }
const DIFF_COLORS = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#F44336']

export default function ProblemsTab({ onOpenProblem, refreshKey }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetch('/api/problems')
      .then(r => r.json())
      .then(data => { setProblems(data); setLoading(false) })
  }, [refreshKey])

  if (loading) return <div style={{ color: '#555', padding: 40, textAlign: 'center', fontSize: 13 }}>Loading...</div>

  const filtered = filter === 'solved' ? problems.filter(p => p.solved)
    : filter === 'unsolved' ? problems.filter(p => !p.solved)
    : problems

  const solvedCount = problems.filter(p => p.solved).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>NeetCode 150</div>
          <div style={{ fontSize: 13, color: '#888' }}>{solvedCount} / 150 solved</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'solved', 'unsolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#FF4F9A22' : 'transparent',
              color: filter === f ? '#FF4F9A' : '#555',
              border: `1px solid ${filter === f ? '#FF4F9A44' : '#2A2A32'}`,
              borderRadius: 6, padding: '4px 10px', fontSize: 11,
              fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {CATEGORY_ORDER.map(cat => {
        const catProblems = filtered.filter(p => p.category === cat)
        if (!catProblems.length) return null
        const catTotal = problems.filter(p => p.category === cat).length
        const catSolved = problems.filter(p => p.category === cat && p.solved).length
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              {cat} · {catSolved}/{catTotal}
            </div>
            <div style={{ background: '#13131A', borderRadius: 12, border: '1px solid #1E1E28', overflow: 'hidden' }}>
              {catProblems.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProblem(p.id, p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    borderBottom: i < catProblems.length - 1 ? '1px solid #1E1E28' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A1A22'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: p.solved ? (DIFF_COLORS[p.difficulty] || '#FF4F9A') : 'transparent',
                    border: p.solved ? 'none' : '1px solid #333',
                  }} />
                  <span style={{ fontSize: 13, color: p.solved ? '#777' : '#CCC', flex: 1 }}>{p.title}</span>
                  <span style={{ fontSize: 10, color: LC_COLORS[p.lcDifficulty], letterSpacing: 0.5 }}>{p.lcDifficulty}</span>
                  {p.aiScore != null && (
                    <span style={{ fontSize: 10, color: '#444' }}>AI {p.aiScore}/10</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
