import { useState, useMemo } from 'react'
import SessionLog from './SessionLog'
import GoalProgress from './GoalProgress'
import WeeklyEarnings from './WeeklyEarnings'

export default function Dashboard({
    sessions,
    hourlyRates,
    dailyGoal,
    onUpdateSession,
    onToggleReported,
    onUpdateHourlyRate,
    onUpdateDailyGoal
}) {
    const [activeTab, setActiveTab] = useState('overview')

    const todayStats = useMemo(() => {
        const today = new Date().toDateString()
        const todaySessions = sessions.filter(s =>
            new Date(s.startTime).toDateString() === today
        )

        let totalMinutes = 0
        let totalEarnings = 0

        todaySessions.forEach(session => {
            totalMinutes += session.activeMinutes || 0
            const rate = hourlyRates[session.projectName] || 0
            totalEarnings += (session.activeMinutes / 60) * rate
        })

        return { totalMinutes, totalEarnings, sessionCount: todaySessions.length }
    }, [sessions, hourlyRates])

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                    DA Flow
                </h1>
                <p className="text-slate-400 mt-1">Your productivity command center</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase tracking-wide">Today's Time</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">
                        {Math.floor(todayStats.totalMinutes / 60)}h {todayStats.totalMinutes % 60}m
                    </p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase tracking-wide">Today's Earnings</p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">
                        ${todayStats.totalEarnings.toFixed(2)}
                    </p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase tracking-wide">Sessions Today</p>
                    <p className="text-3xl font-bold text-purple-400 mt-2">
                        {todayStats.sessionCount}
                    </p>
                </div>
            </div>

            {/* Goal Progress */}
            <GoalProgress
                currentEarnings={todayStats.totalEarnings}
                dailyGoal={dailyGoal}
                onUpdateGoal={onUpdateDailyGoal}
            />

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-800 rounded-xl p-1 mb-6 mt-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'overview'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Weekly Earnings
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'logs'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Session Logs
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
                <WeeklyEarnings
                    sessions={sessions}
                    hourlyRates={hourlyRates}
                    onUpdateHourlyRate={onUpdateHourlyRate}
                />
            ) : (
                <SessionLog
                    sessions={sessions}
                    onUpdateSession={onUpdateSession}
                    onToggleReported={onToggleReported}
                />
            )}
        </div>
    )
}
