import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [sessions, setSessions] = useState([])
  const [hourlyRates, setHourlyRates] = useState({})
  const [dailyGoal, setDailyGoal] = useState(100)

  useEffect(() => {
    loadData()

    // Listen for storage changes
    if (window.chrome && chrome.storage) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes.sessions || changes.hourlyRates || changes.dailyGoal) {
          loadData()
        }
      })
    } else {
      window.addEventListener('storage', loadData)
    }
  }, [])

  const loadData = () => {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['sessions', 'hourlyRates', 'dailyGoal'], (result) => {
        if (result.sessions) setSessions(result.sessions)
        if (result.hourlyRates) setHourlyRates(result.hourlyRates)
        if (result.dailyGoal) setDailyGoal(result.dailyGoal)
      })
    } else {
      const storedSessions = localStorage.getItem('da-flow-sessions')
      const storedRates = localStorage.getItem('da-flow-rates')
      const storedGoal = localStorage.getItem('da-flow-goal')

      if (storedSessions) setSessions(JSON.parse(storedSessions))
      if (storedRates) setHourlyRates(JSON.parse(storedRates))
      if (storedGoal) setDailyGoal(JSON.parse(storedGoal))
    }
  }

  const saveData = (key, data) => {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: data })
    } else {
      localStorage.setItem(`da-flow-${key}`, JSON.stringify(data))
    }
  }

  const updateSession = (sessionId, updates) => {
    const updated = sessions.map(s =>
      s.id === sessionId ? { ...s, ...updates } : s
    )
    setSessions(updated)
    saveData('sessions', updated)
  }

  const toggleReported = (sessionId) => {
    const updated = sessions.map(s =>
      s.id === sessionId ? { ...s, reportedToDA: !s.reportedToDA } : s
    )
    setSessions(updated)
    saveData('sessions', updated)
  }

  const updateHourlyRate = (projectName, rate) => {
    const updated = { ...hourlyRates, [projectName]: rate }
    setHourlyRates(updated)
    saveData('hourlyRates', updated)
  }

  const updateDailyGoal = (goal) => {
    setDailyGoal(goal)
    saveData('dailyGoal', goal)
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
