import { useState } from 'react'
import TodayTab from './TodayTab'
import ProblemsTab from './ProblemsTab'
import ProblemModal from './ProblemModal'
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  const [view, setView] = useState('today')
  const [modal, setModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOpenProblem = (id, problem) => setModal({ id, problem })

  const handleClose = (saved) => {
    if (saved) setRefreshKey(k => k + 1)
    setModal(null)
  }

  return (
    <>
      <Analytics />
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: '#F0EEF8',
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
        padding: '32px 24px',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[{ key: 'today', label: 'Today' }, { key: 'problems', label: 'Problems' }].map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)} style={{
              background: view === key ? '#FF4F9A' : '#1A1A1E',
              color: view === key ? '#fff' : '#888',
              border: 'none', borderRadius: 8, padding: '8px 16px',
              fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              fontWeight: 600, letterSpacing: 0.5, transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {view === 'today' && <TodayTab onOpenProblem={handleOpenProblem} refreshKey={refreshKey} />}
        {view === 'problems' && <ProblemsTab onOpenProblem={handleOpenProblem} refreshKey={refreshKey} />}

        {modal && (
          <ProblemModal
            id={modal.id}
            problem={modal.problem}
            onClose={handleClose}
          />
        )}
      </div>
    </>
  )
}
