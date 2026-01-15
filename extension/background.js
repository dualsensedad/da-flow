// DA Flow - Background Service Worker
// Manages session timing using chrome.alarms for persistence

const ALARM_NAME = 'da-flow-tick';
const TICK_INTERVAL_MINUTES = 1;

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['sessions', 'currentSession'], (result) => {
        if (!result.sessions) {
            chrome.storage.local.set({ sessions: [] });
        }
    });
});

// Handle alarm ticks for active sessions
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        chrome.storage.local.get(['currentSession'], (result) => {
            if (result.currentSession && result.currentSession.isActive && !result.currentSession.isPaused) {
                const session = result.currentSession;
                session.activeMinutes = (session.activeMinutes || 0) + 1;
                chrome.storage.local.set({ currentSession: session });
            }
        });
    }
});

// Handle keyboard shortcuts (Emergency Stop: Cmd+Shift+S)
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'emergency-stop') {
        const result = await stopSession();
        if (result.success) {
            // Show notification so user knows it worked without looking
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
            setTimeout(() => {
                chrome.action.setBadgeText({ text: '' });
            }, 2000);
        }
    }
});

// Message handler for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'startSession':
            startSession(message.projectName);
            sendResponse({ success: true });
            break;
        case 'stopSession':
            stopSession().then(sendResponse);
            return true; // Keep channel open for async
        case 'togglePause':
            togglePause().then(sendResponse);
            return true;
        case 'getStatus':
            getStatus().then(sendResponse);
            return true;
        case 'getSessions':
            getSessions().then(sendResponse);
            return true;
        case 'updateSession':
            updateSession(message.sessionId, message.updates).then(sendResponse);
            return true;
        case 'toggleReported':
            toggleReported(message.sessionId).then(sendResponse);
            return true;
    }
});

function startSession(projectName) {
    const session = {
        id: Date.now().toString(),
        projectName: projectName || 'Untitled Project',
        startTime: new Date().toISOString(),
        endTime: null,
        activeMinutes: 0,
        isActive: true,
        isPaused: false,
        reportedToDA: false
    };

    chrome.storage.local.set({ currentSession: session });
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_MINUTES });
}

async function stopSession() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['currentSession', 'sessions'], (result) => {
            if (result.currentSession) {
                const session = result.currentSession;
                session.isActive = false;
                session.endTime = new Date().toISOString();

                const sessions = result.sessions || [];
                sessions.unshift(session);

                chrome.storage.local.set({
                    sessions: sessions,
                    currentSession: null
                });
                chrome.alarms.clear(ALARM_NAME);
                resolve({ success: true, session: session });
            } else {
                resolve({ success: false });
            }
        });
    });
}

async function togglePause() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['currentSession'], (result) => {
            if (result.currentSession) {
                const session = result.currentSession;
                session.isPaused = !session.isPaused;
                chrome.storage.local.set({ currentSession: session });
                resolve({ success: true, isPaused: session.isPaused });
            } else {
                resolve({ success: false });
            }
        });
    });
}

async function getStatus() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['currentSession'], (result) => {
            resolve(result.currentSession || null);
        });
    });
}

async function getSessions() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
            resolve(result.sessions || []);
        });
    });
}

async function updateSession(sessionId, updates) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || [];
            const index = sessions.findIndex(s => s.id === sessionId);
            if (index !== -1) {
                sessions[index] = { ...sessions[index], ...updates };
                chrome.storage.local.set({ sessions: sessions });
                resolve({ success: true });
            } else {
                resolve({ success: false });
            }
        });
    });
}

async function toggleReported(sessionId) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || [];
            const index = sessions.findIndex(s => s.id === sessionId);
            if (index !== -1) {
                sessions[index].reportedToDA = !sessions[index].reportedToDA;
                chrome.storage.local.set({ sessions: sessions });
                resolve({ success: true, reportedToDA: sessions[index].reportedToDA });
            } else {
                resolve({ success: false });
            }
        });
    });
}
