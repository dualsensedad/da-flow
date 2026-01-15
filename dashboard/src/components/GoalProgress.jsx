import { useState } from 'react'

export default function GoalProgress({ currentEarnings, dailyGoal, onUpdateGoal }) {
    const [isEditing, setIsEditing] = useState(false)
    const [tempGoal, setTempGoal] = useState(dailyGoal)

    const progress = Math.min((currentEarnings / dailyGoal) * 100, 100)
    const isComplete = currentEarnings >= dailyGoal

    const handleSave = () => {
        onUpdateGoal(parseFloat(tempGoal) || 100)
        setIsEditing(false)
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Daily Goal Progress</h2>
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
                            setTempGoal(dailyGoal)
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
                    ${currentEarnings.toFixed(2)} / ${dailyGoal.toFixed(2)}
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
