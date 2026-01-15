// Shared storage utilities for DA Flow
// Used by both the extension and the dashboard

const STORAGE_KEYS = {
    SESSIONS: 'da-flow-sessions',
    CURRENT_SESSION: 'da-flow-current',
    HOURLY_RATES: 'da-flow-rates',
    DAILY_GOAL: 'da-flow-goal'
};

// For use in the dashboard (localStorage)
export function getSessionsFromLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
}

export function saveSessionsToLocalStorage(sessions) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getHourlyRates() {
    const data = localStorage.getItem(STORAGE_KEYS.HOURLY_RATES);
    return data ? JSON.parse(data) : {};
}

export function saveHourlyRates(rates) {
    localStorage.setItem(STORAGE_KEYS.HOURLY_RATES, JSON.stringify(rates));
}

export function getDailyGoal() {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_GOAL);
    return data ? JSON.parse(data) : 100;
}

export function saveDailyGoal(goal) {
    localStorage.setItem(STORAGE_KEYS.DAILY_GOAL, JSON.stringify(goal));
}

// Calculate earnings for a session
export function calculateEarnings(session, hourlyRates) {
    const rate = hourlyRates[session.projectName] || 0;
    return (session.activeMinutes / 60) * rate;
}

// Format minutes to hours and minutes string
export function formatDuration(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
}

export { STORAGE_KEYS };
