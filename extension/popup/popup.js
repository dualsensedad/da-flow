// DA Flow Popup Controller

let updateInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initializePopup();
    setupEventListeners();
    startUIUpdates();
});

async function initializePopup() {
    // Check for auto-detected project name from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('app.dataannotation.tech')) {
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProjectTitle' });
            if (response && response.title) {
                document.getElementById('projectNameInput').value = response.title;
            }
        } catch (e) {
            // Content script may not be loaded
        }
    }

    await updateUI();
    await updateStats();
}

function setupEventListeners() {
    document.getElementById('mainBtn').addEventListener('click', handleMainButton);
    document.getElementById('pauseBtn').addEventListener('click', handlePauseButton);
    document.getElementById('openDashboardBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
    });

    // Modal event listeners
    document.getElementById('modalCancel').addEventListener('click', hideConfirmModal);
    document.getElementById('modalConfirm').addEventListener('click', confirmStartSession);
}

async function handleMainButton() {
    const status = await chrome.runtime.sendMessage({ action: 'getStatus' });

    if (status && status.isActive) {
        // Stop session directly (no confirmation needed)
        await chrome.runtime.sendMessage({ action: 'stopSession' });
        await updateUI();
        await updateStats();
    } else {
        // Show confirmation modal before starting
        const projectName = document.getElementById('projectNameInput').value.trim() || 'Untitled Project';
        showConfirmModal(projectName);
    }
}

function showConfirmModal(projectName) {
    document.getElementById('modalProjectName').textContent = projectName;
    document.getElementById('confirmModal').style.display = 'flex';
}

function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

async function confirmStartSession() {
    const projectName = document.getElementById('projectNameInput').value.trim();
    await chrome.runtime.sendMessage({ action: 'startSession', projectName });
    hideConfirmModal();
    await updateUI();
    await updateStats();
}

async function handlePauseButton() {
    await chrome.runtime.sendMessage({ action: 'togglePause' });
    await updateUI();
}

async function updateUI() {
    const status = await chrome.runtime.sendMessage({ action: 'getStatus' });

    const mainBtn = document.getElementById('mainBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    const projectDisplay = document.getElementById('projectDisplay');
    const projectInput = document.getElementById('projectNameInput');

    if (status && status.isActive) {
        // Session is active
        mainBtn.textContent = 'Stop Session';
        mainBtn.classList.remove('btn-start');
        mainBtn.classList.add('btn-stop');

        pauseBtn.disabled = false;
        projectInput.disabled = true;

        if (status.isPaused) {
            pauseBtn.textContent = '▶️ Resume';
            pauseBtn.classList.add('paused');
            timerDisplay.classList.remove('active');
            timerDisplay.classList.add('paused');
        } else {
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.classList.remove('paused');
            timerDisplay.classList.add('active');
            timerDisplay.classList.remove('paused');
        }

        timerDisplay.textContent = formatTime(status.activeMinutes || 0);
        projectDisplay.textContent = status.projectName;
    } else {
        // No active session
        mainBtn.textContent = 'Start Session';
        mainBtn.classList.add('btn-start');
        mainBtn.classList.remove('btn-stop');

        pauseBtn.disabled = true;
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('paused');
        projectInput.disabled = false;

        timerDisplay.textContent = '00:00';
        timerDisplay.classList.remove('active', 'paused');
        projectDisplay.textContent = 'No active session';
    }
}

async function updateStats() {
    const sessions = await chrome.runtime.sendMessage({ action: 'getSessions' });
    const status = await chrome.runtime.sendMessage({ action: 'getStatus' });

    const today = new Date().toDateString();
    let todayMinutes = 0;

    sessions.forEach(session => {
        const sessionDate = new Date(session.startTime).toDateString();
        if (sessionDate === today) {
            todayMinutes += session.activeMinutes || 0;
        }
    });

    // Add current session if active
    if (status && status.isActive) {
        todayMinutes += status.activeMinutes || 0;
    }

    document.getElementById('todayMinutes').textContent = todayMinutes;
    document.getElementById('sessionCount').textContent = sessions.length;
}

function formatTime(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:00`;
}

function startUIUpdates() {
    // Update UI every 5 seconds when popup is open
    updateInterval = setInterval(async () => {
        await updateUI();
        await updateStats();
    }, 5000);
}

// Clean up on popup close
window.addEventListener('unload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
