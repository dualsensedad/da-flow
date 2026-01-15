import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [sessions, setSessions] = useState([])
  const [hourlyRates, setHourlyRates] = useState({})
  const [dailyGoal, setDailyGoal] = useState(100)

  useEffect(() => {
    loadData()

    // Listen for storage changes from extension
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const loadData = () => {
    // Load from localStorage (shared with extension)
    const storedSessions = localStorage.getItem('da-flow-sessions')
    const storedRates = localStorage.getItem('da-flow-rates')
    const storedGoal = localStorage.getItem('da-flow-goal')

    if (storedSessions) setSessions(JSON.parse(storedSessions))
    if (storedRates) setHourlyRates(JSON.parse(storedRates))
    if (storedGoal) setDailyGoal(JSON.parse(storedGoal))
  }

  const updateSession = (sessionId, updates) => {
    const updated = sessions.map(s =>
      s.id === sessionId ? { ...s, ...updates } : s
    )
    setSessions(updated)
    localStorage.setItem('da-flow-sessions', JSON.stringify(updated))
  }

  const toggleReported = (sessionId) => {
    const updated = sessions.map(s =>
      s.id === sessionId ? { ...s, reportedToDA: !s.reportedToDA } : s
    )
    setSessions(updated)
    localStorage.setItem('da-flow-sessions', JSON.stringify(updated))
  }

  const updateHourlyRate = (projectName, rate) => {
    const updated = { ...hourlyRates, [projectName]: rate }
    setHourlyRates(updated)
    localStorage.setItem('da-flow-rates', JSON.stringify(updated))
  }

  const updateDailyGoal = (goal) => {
    setDailyGoal(goal)
    localStorage.setItem('da-flow-goal', JSON.stringify(goal))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Dashboard
        sessions={sessions}
        hourlyRates={hourlyRates}
        dailyGoal={dailyGoal}
        onUpdateSession={updateSession}
        onToggleReported={toggleReported}
        onUpdateHourlyRate={updateHourlyRate}
        onUpdateDailyGoal={updateDailyGoal}
      />
    </div>
  )
}

export default App
