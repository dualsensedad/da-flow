import { useMemo, useState } from 'react'

export default function WeeklyEarnings({ sessions, hourlyRates, onUpdateHourlyRate }) {
    const [editingProject, setEditingProject] = useState(null)
    const [tempRate, setTempRate] = useState('')

    const weeklyData = useMemo(() => {
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dailyData = days.map(() => ({ minutes: 0, earnings: 0 }))
        const projectMinutes = {}

        sessions.forEach(session => {
            const sessionDate = new Date(session.startTime)
            if (sessionDate >= weekStart) {
                const dayIndex = sessionDate.getDay()
                dailyData[dayIndex].minutes += session.activeMinutes || 0

                const rate = hourlyRates[session.projectName] || 0
                dailyData[dayIndex].earnings += (session.activeMinutes / 60) * rate

                if (!projectMinutes[session.projectName]) {
                    projectMinutes[session.projectName] = 0
                }
                projectMinutes[session.projectName] += session.activeMinutes || 0
            }
        })

        const totalMinutes = dailyData.reduce((sum, d) => sum + d.minutes, 0)
        const totalEarnings = dailyData.reduce((sum, d) => sum + d.earnings, 0)

        return { days, dailyData, projectMinutes, totalMinutes, totalEarnings }
    }, [sessions, hourlyRates])

    const handleSaveRate = (projectName) => {
        onUpdateHourlyRate(projectName, parseFloat(tempRate) || 0)
        setEditingProject(null)
    }

    const maxMinutes = Math.max(...weeklyData.dailyData.map(d => d.minutes), 1)

    return (
        <div className="space-y-6">
            {/* Weekly Chart */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">This Week</h3>

                <div className="flex items-end justify-between h-40 gap-2">
                    {weeklyData.days.map((day, i) => (
                        <div key={day} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center">
                                <span className="text-xs text-slate-400 mb-1">
                                    {weeklyData.dailyData[i].minutes > 0 ? `${weeklyData.dailyData[i].minutes}m` : ''}
                                </span>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
                                    style={{
                                        height: `${(weeklyData.dailyData[i].minutes / maxMinutes) * 100}px`,
                                        minHeight: weeklyData.dailyData[i].minutes > 0 ? '8px' : '0'
                                    }}
                                />
                            </div>
                            <span className="text-xs text-slate-400 mt-2">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
                    <div>
                        <p className="text-slate-400 text-sm">Total Time</p>
                        <p className="text-xl font-bold">
                            {Math.floor(weeklyData.totalMinutes / 60)}h {weeklyData.totalMinutes % 60}m
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Total Earnings</p>
                        <p className="text-xl font-bold text-emerald-400">
                            ${weeklyData.totalEarnings.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Project Rates */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Hourly Rates by Project</h3>

                {Object.keys(weeklyData.projectMinutes).length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No projects this week</p>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(weeklyData.projectMinutes).map(([project, minutes]) => (
                            <div
                                key={project}
                                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{project}</p>
                                    <p className="text-sm text-slate-400">
                                        {Math.floor(minutes / 60)}h {minutes % 60}m this week
                                    </p>
                                </div>

                                {editingProject === project ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">$</span>
                                        <input
                                            type="number"
                                            value={tempRate}
                                            onChange={(e) => setTempRate(e.target.value)}
                                            className="w-16 bg-slate-600 rounded px-2 py-1 text-white text-right"
                                            placeholder="0"
                                        />
                                        <span className="text-slate-400">/hr</span>
                                        <button
                                            onClick={() => handleSaveRate(project)}
                                            className="text-emerald-400 hover:text-emerald-300 ml-2"
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditingProject(project)
                                            setTempRate(hourlyRates[project] || '')
                                        }}
                                        className="flex items-center gap-1 text-slate-400 hover:text-white"
                                    >
                                        <span className="font-medium text-emerald-400">
                                            ${hourlyRates[project] || 0}/hr
                                        </span>
                                        <span className="text-xs">✎</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
