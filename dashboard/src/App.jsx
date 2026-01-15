import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [sessions, setSessions] = useState([])
  const [hourlyRates, setHourlyRates] = useState({})
  const [goalAmount, setGoalAmount] = useState(100)
  const [goalPeriod, setGoalPeriod] = useState('daily')

  useEffect(() => {
    loadData()

    // Listen for storage changes
    if (window.chrome && chrome.storage) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes.sessions || changes.hourlyRates || changes.goalAmount || changes.goalPeriod) {
          loadData()
        }
      })
    } else {
      window.addEventListener('storage', loadData)
    }
  }, [])

  const loadData = () => {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['sessions', 'hourlyRates', 'goalAmount', 'goalPeriod'], (result) => {
        if (result.sessions) setSessions(result.sessions)
        if (result.hourlyRates) setHourlyRates(result.hourlyRates)
        if (result.goalAmount) setGoalAmount(result.goalAmount)
        if (result.goalPeriod) setGoalPeriod(result.goalPeriod)
      })
    } else {
      const storedSessions = localStorage.getItem('da-flow-sessions')
      const storedRates = localStorage.getItem('da-flow-rates')
      const storedGoal = localStorage.getItem('da-flow-goal')
      const storedPeriod = localStorage.getItem('da-flow-period')

      if (storedSessions) setSessions(JSON.parse(storedSessions))
      if (storedRates) setHourlyRates(JSON.parse(storedRates))
      if (storedGoal) setGoalAmount(JSON.parse(storedGoal))
      if (storedPeriod) setGoalPeriod(JSON.parse(storedPeriod))
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

  const updateGoalAmount = (amount) => {
    setGoalAmount(amount)
    saveData('goalAmount', amount)
  }

  const updateGoalPeriod = (period) => {
    setGoalPeriod(period)
    saveData('goalPeriod', period)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Dashboard
        sessions={sessions}
        hourlyRates={hourlyRates}
        goalAmount={goalAmount}
        goalPeriod={goalPeriod}
        onUpdateSession={updateSession}
        onToggleReported={toggleReported}
        onUpdateHourlyRate={updateHourlyRate}
        onUpdateGoal={updateGoalAmount}
        onUpdatePeriod={updateGoalPeriod}
      />
    </div>
  )
}

export default App
