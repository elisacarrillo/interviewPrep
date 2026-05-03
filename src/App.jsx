import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import StudyPlan from './prepdoc'
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Analytics/>
      <StudyPlan/>
    </>

  )
}

export default App
