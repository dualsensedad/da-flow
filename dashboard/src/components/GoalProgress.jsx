import { useState, useMemo } from 'react'

export default function GoalProgress({
    sessions,
    hourlyRates,
    goalAmount,
    goalPeriod,
    onUpdateGoal,
    onUpdatePeriod
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [tempGoal, setTempGoal] = useState(goalAmount)

    const periodEarnings = useMemo(() => {
        const now = new Date()
        let startDate

        switch (goalPeriod) {
            case 'weekly':
                startDate = new Date(now)
                startDate.setDate(now.getDate() - now.getDay())
                startDate.setHours(0, 0, 0, 0)
                break
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case 'daily':
            default:
                startDate = new Date(now.toDateString())
        }

        let total = 0
        sessions.forEach(session => {
            const sessionDate = new Date(session.startTime)
            if (sessionDate >= startDate) {
                const rate = hourlyRates[session.projectName] || 0
                total += (session.activeMinutes / 60) * rate
            }
        })
        return total
    }, [sessions, hourlyRates, goalPeriod])

    const progress = goalAmount > 0 ? Math.min((periodEarnings / goalAmount) * 100, 100) : 0
    const isComplete = periodEarnings >= goalAmount

    const handleSave = () => {
        onUpdateGoal(parseFloat(tempGoal) || 100)
        setIsEditing(false)
    }

    const periodLabels = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{periodLabels[goalPeriod]} Goal</h2>
                    {/* Period Selector */}
                    <div className="flex bg-slate-700 rounded-lg p-0.5">
                        {['daily', 'weekly', 'monthly'].map(p => (
                            <button
                                key={p}
                                onClick={() => onUpdatePeriod(p)}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${goalPeriod === p
                                        ? 'bg-slate-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">$</span>
                        <input
                            type="number"
                            value={tempGoal}
                            onChange={(e) => setTempGoal(e.target.value)}
                            className="w-20 bg-slate-700 rounded px-2 py-1 text-white"
                        />
                        <button
                            onClick={handleSave}
                            className="text-emerald-400 hover:text-emerald-300 text-sm"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setTempGoal(goalAmount)
                            setIsEditing(true)
                        }}
                        className="text-slate-400 hover:text-white text-sm"
                    >
                        Edit Goal
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`absolute h-full transition-all duration-500 ${isComplete
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : 'bg-gradient-to-r from-blue-600 to-blue-400'
                        }`}
                    style={{ width: `${progress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                    ${periodEarnings.toFixed(2)} / ${goalAmount.toFixed(2)}
                </div>
            </div>

            {isComplete && (
                <p className="text-emerald-400 text-center mt-3 font-medium">
                    🎉 Goal achieved!
                </p>
            )}
        </div>
    )
}
