import { useState } from 'react'

export default function SessionLog({ sessions, onUpdateSession, onToggleReported }) {
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})

    const formatTime = (dateString) => {
        if (!dateString) return '--'
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
    }

    const handleEdit = (session) => {
        setEditingId(session.id)
        setEditForm({
            projectName: session.projectName,
            activeMinutes: session.activeMinutes,
            startTime: session.startTime.slice(0, 16),
            endTime: session.endTime ? session.endTime.slice(0, 16) : ''
        })
    }

    const handleSave = (sessionId) => {
        const updates = {
            projectName: editForm.projectName,
            activeMinutes: parseInt(editForm.activeMinutes) || 0,
            startTime: new Date(editForm.startTime).toISOString(),
            endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : null
        }
        onUpdateSession(sessionId, updates)
        setEditingId(null)
    }

    const handleCancel = () => {
        setEditingId(null)
        setEditForm({})
    }

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Session History</h3>
                <span className="text-sm text-slate-400">{sessions.length} sessions</span>
            </div>

            {sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                    <p>No sessions recorded yet.</p>
                    <p className="text-sm mt-1">Start tracking with the DA Flow extension!</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-700">
                    {sessions.map((session) => (
                        <div key={session.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                            {editingId === session.id ? (
                                // Edit Mode
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-400">Project Name</label>
                                            <input
                                                type="text"
                                                value={editForm.projectName}
                                                onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                                                className="w-full bg-slate-700 rounded px-3 py-2 text-white mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400">Active Minutes</label>
                                            <input
                                                type="number"
                                                value={editForm.activeMinutes}
                                                onChange={(e) => setEditForm({ ...editForm, activeMinutes: e.target.value })}
                                                className="w-full bg-slate-700 rounded px-3 py-2 text-white mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-400">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editForm.startTime}
                                                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                                                className="w-full bg-slate-700 rounded px-3 py-2 text-white mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400">End Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editForm.endTime}
                                                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                                                className="w-full bg-slate-700 rounded px-3 py-2 text-white mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="px-3 py-1 text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSave(session.id)}
                                            className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-medium">{session.projectName}</h4>
                                            <span className="text-xs text-slate-500">
                                                {formatDate(session.startTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                            <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                                            <span className="text-emerald-400 font-medium">
                                                {session.activeMinutes} min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Reported Toggle */}
                                        <button
                                            onClick={() => onToggleReported(session.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${session.reportedToDA
                                                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
                                                    : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                                                }`}
                                        >
                                            {session.reportedToDA ? '✓ Reported' : 'Mark Reported'}
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => handleEdit(session)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Edit session"
                                        >
                                            ✎
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
