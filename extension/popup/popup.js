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
        let projectTitle = '';
        let bonus = 0;

        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProjectInfo' });
            if (response && response.title) {
                projectTitle = response.title;
                bonus = response.bonus || 0;
            }
        } catch (e) {
            // Content script may not be loaded - use fallback
            console.log('Content script not available, using fallback');
        }

        // Fallback: Use tab title if content script didn't provide a title
        if (!projectTitle && tab.title) {
            projectTitle = tab.title
                .replace(' - DataAnnotation', '')
                .replace('DataAnnotation', '')
                .trim();

            // Check for bonus in title
            const bonusMatch = projectTitle.match(/\[PRIORITY\s+\+\$(\d+\.?\d*)\]/i);
            if (bonusMatch) {
                bonus = parseFloat(bonusMatch[1]);
                projectTitle = projectTitle.replace(/\[PRIORITY\s+\+\$\d+\.?\d*\]\s*/i, '').trim();

                // Store the bonus
                const result = await chrome.storage.local.get(['bonusRates']);
                const bonuses = result.bonusRates || {};
                bonuses[projectTitle] = bonus;
                await chrome.storage.local.set({ bonusRates: bonuses });
            }
        }

        if (projectTitle) {
            document.getElementById('projectNameInput').value = projectTitle;
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
        await showConfirmModal(projectName);
    }
}

async function showConfirmModal(projectName) {
    document.getElementById('modalProjectName').textContent = projectName;

    // Look up pay rate from stored rates
    const result = await chrome.storage.local.get(['hourlyRates', 'bonusRates']);
    const hourlyRates = result.hourlyRates || {};
    const bonusRates = result.bonusRates || {};

    const rate = hourlyRates[projectName];
    const bonus = bonusRates[projectName];

    const rateEl = document.getElementById('modalPayRate');
    const bonusEl = document.getElementById('modalBonus');
    const bonusRow = document.getElementById('bonusRow');

    if (rate !== undefined && rate !== null) {
        rateEl.textContent = `$${rate.toFixed(2)}/hr`;
        rateEl.classList.remove('unknown');
    } else {
        rateEl.textContent = 'Not found - visit dashboard first';
        rateEl.classList.add('unknown');
    }

    if (bonus !== undefined && bonus !== null && bonus > 0) {
        bonusEl.textContent = `+$${bonus.toFixed(2)}/hr`;
        bonusRow.style.display = 'flex';
    } else {
        bonusRow.style.display = 'none';
    }

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

    // Update pay info display
    await updatePayInfo(status);
}

async function updatePayInfo(status) {
    const payInfoEl = document.getElementById('payInfo');
    const payRateEl = document.getElementById('payRateDisplay');
    const liveEarningsEl = document.getElementById('liveEarnings');

    if (!status || !status.isActive) {
        payInfoEl.style.display = 'none';
        return;
    }

    // Get rates from storage
    const result = await chrome.storage.local.get(['hourlyRates', 'bonusRates']);
    const hourlyRates = result.hourlyRates || {};
    const bonusRates = result.bonusRates || {};

    const baseRate = hourlyRates[status.projectName] || 0;
    const bonus = bonusRates[status.projectName] || 0;
    const totalRate = baseRate + bonus;

    // Format pay rate display
    let rateText = '';
    if (baseRate > 0) {
        rateText = `$${baseRate.toFixed(2)}/hr`;
        if (bonus > 0) {
            rateText += ` <span class="bonus">(+$${bonus.toFixed(2)} bonus)</span>`;
        }
    } else if (bonus > 0) {
        rateText = `<span class="bonus">$${bonus.toFixed(2)}/hr bonus</span>`;
    } else {
        rateText = 'Rate not set';
    }
    payRateEl.innerHTML = rateText;

    // Calculate live earnings
    const activeMinutes = status.activeMinutes || 0;
    const earnings = (activeMinutes / 60) * totalRate;
    liveEarningsEl.textContent = `Earned: $${earnings.toFixed(2)}`;

    payInfoEl.style.display = 'block';
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
    // Update UI every second for live earnings display
    updateInterval = setInterval(async () => {
        await updateUI();
        await updateStats();
    }, 1000);
}

// Clean up on popup close
window.addEventListener('unload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
