// DA Flow Content Script - Auto-Detection for DataAnnotation.tech
// Target: https://app.dataannotation.tech

let sessionWidget = null;
let widgetUpdateInterval = null;

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getProjectTitle') {
        const title = extractProjectTitle();
        sendResponse({ title: title });
    }
    if (message.action === 'getProjectInfo') {
        const info = extractProjectInfo();
        sendResponse(info);
    }
    if (message.action === 'sessionStarted') {
        showSessionWidget(message.projectName, message.rate);
    }
    if (message.action === 'sessionStopped') {
        hideSessionWidget();
    }
    return true;
});

// ============== Live Session Widget ==============

function createSessionWidget() {
    if (document.getElementById('da-flow-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'da-flow-widget';
    widget.innerHTML = `
    <div class="da-flow-widget-header">
      <span class="da-flow-logo">⏱️ DA Flow</span>
      <button class="da-flow-minimize" id="da-flow-minimize">−</button>
    </div>
    <div class="da-flow-widget-body" id="da-flow-body">
      <div class="da-flow-project" id="da-flow-project">Project Name</div>
      <div class="da-flow-stats">
        <div class="da-flow-stat">
          <span class="da-flow-stat-value" id="da-flow-time">00:00</span>
          <span class="da-flow-stat-label">Time</span>
        </div>
        <div class="da-flow-stat">
          <span class="da-flow-stat-value" id="da-flow-earned">$0.00</span>
          <span class="da-flow-stat-label">Earned</span>
        </div>
      </div>
    </div>
  `;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
    #da-flow-widget {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid #334155;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      min-width: 180px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    #da-flow-widget:hover {
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
    }
    .da-flow-widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(34, 197, 94, 0.15);
      border-bottom: 1px solid #334155;
    }
    .da-flow-logo {
      font-size: 12px;
      font-weight: 600;
      color: #22c55e;
    }
    .da-flow-minimize {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
    }
    .da-flow-minimize:hover {
      color: #fff;
    }
    .da-flow-widget-body {
      padding: 12px;
    }
    .da-flow-widget-body.minimized {
      display: none;
    }
    .da-flow-project {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }
    .da-flow-stats {
      display: flex;
      gap: 16px;
    }
    .da-flow-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .da-flow-stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
    }
    .da-flow-stat-value#da-flow-earned {
      color: #22c55e;
    }
    .da-flow-stat-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `;

    document.head.appendChild(style);
    document.body.appendChild(widget);

    // Minimize toggle
    document.getElementById('da-flow-minimize').addEventListener('click', () => {
        const body = document.getElementById('da-flow-body');
        const btn = document.getElementById('da-flow-minimize');
        body.classList.toggle('minimized');
        btn.textContent = body.classList.contains('minimized') ? '+' : '−';
    });

    sessionWidget = widget;
}

function showSessionWidget(projectName, rate) {
    createSessionWidget();

    document.getElementById('da-flow-project').textContent = projectName;
    document.getElementById('da-flow-widget').style.display = 'block';

    // Start updating every second
    let startTime = Date.now();
    const hourlyRate = rate || 0;

    // Get session start time from storage for accuracy
    chrome.storage.local.get(['currentSession'], (result) => {
        if (result.currentSession && result.currentSession.startTime) {
            startTime = new Date(result.currentSession.startTime).getTime();
        }

        widgetUpdateInterval = setInterval(() => {
            chrome.storage.local.get(['currentSession', 'hourlyRates', 'bonusRates'], (res) => {
                if (!res.currentSession || !res.currentSession.isActive) {
                    hideSessionWidget();
                    return;
                }

                const session = res.currentSession;
                const rates = res.hourlyRates || {};
                const bonuses = res.bonusRates || {};

                // Calculate elapsed time
                const elapsed = Date.now() - startTime;
                const seconds = Math.floor(elapsed / 1000);
                const mins = Math.floor(seconds / 60);
                const hrs = Math.floor(mins / 60);

                let timeStr;
                if (hrs > 0) {
                    timeStr = `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
                } else {
                    timeStr = `${mins}:${(seconds % 60).toString().padStart(2, '0')}`;
                }

                // Calculate earnings
                const projectRate = rates[session.projectName] || 0;
                const projectBonus = bonuses[session.projectName] || 0;
                const totalRate = projectRate + projectBonus;
                const hoursWorked = seconds / 3600;
                const earned = hoursWorked * totalRate;

                document.getElementById('da-flow-time').textContent = timeStr;
                document.getElementById('da-flow-earned').textContent = `$${earned.toFixed(2)}`;
            });
        }, 1000);
    });
}

function hideSessionWidget() {
    if (widgetUpdateInterval) {
        clearInterval(widgetUpdateInterval);
        widgetUpdateInterval = null;
    }
    if (sessionWidget) {
        sessionWidget.style.display = 'none';
    }
}

// Check for active session on page load
function checkForActiveSession() {
    chrome.storage.local.get(['currentSession', 'hourlyRates'], (result) => {
        if (result.currentSession && result.currentSession.isActive) {
            const rate = result.hourlyRates?.[result.currentSession.projectName] || 0;
            showSessionWidget(result.currentSession.projectName, rate);
        }
    });
}

// ============== Project Detection & Rate Scraping ==============

function extractProjectTitle() {
    const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
    if (breadcrumbActive && breadcrumbActive.textContent) {
        return breadcrumbActive.textContent.trim();
    }

    const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
    if (breadcrumbNav) {
        const lastItem = breadcrumbNav.querySelector('li:last-child');
        if (lastItem && lastItem.textContent) {
            return lastItem.textContent.trim();
        }
    }

    const h3s = document.querySelectorAll('h3.tw-text-h3, h3[class*="tw-text"]');
    for (const h3 of h3s) {
        const text = h3.textContent.trim();
        if (text.length > 0 && text.length < 100 &&
            !['Projects', 'Qualifications', 'Overview'].includes(text)) {
            return text;
        }
    }

    if (document.title) {
        return document.title
            .replace(' - DataAnnotation', '')
            .replace('DataAnnotation', '')
            .trim();
    }

    return '';
}

function extractProjectInfo() {
    const title = extractProjectTitle();
    return { title };
}

function scrapeAndCacheRates() {
    const projectRates = {};
    const bonusRates = {};

    const rows = document.querySelectorAll('tr');

    rows.forEach(row => {
        const link = row.querySelector('a[href*="project_id="], a[href*="/workers/tasks"]');
        if (!link) return;

        const projectName = link.textContent.trim();
        if (!projectName) return;

        const cells = row.querySelectorAll('td');
        for (const cell of cells) {
            const text = cell.textContent.trim();

            const rateMatch = text.match(/\$(\d+\.?\d*)\/?hr/i);
            if (rateMatch) {
                projectRates[projectName] = parseFloat(rateMatch[1]);
            }

            const bonusMatch = text.match(/\+\s*\$(\d+\.?\d*)/i) ||
                text.match(/bonus[:\s]*\$(\d+\.?\d*)/i);
            if (bonusMatch) {
                bonusRates[projectName] = parseFloat(bonusMatch[1]);
            }
        }
    });

    if (Object.keys(projectRates).length > 0 || Object.keys(bonusRates).length > 0) {
        chrome.storage.local.get(['hourlyRates', 'bonusRates'], (result) => {
            const existingRates = result.hourlyRates || {};
            const existingBonuses = result.bonusRates || {};
            const mergedRates = { ...existingRates, ...projectRates };
            const mergedBonuses = { ...existingBonuses, ...bonusRates };
            chrome.storage.local.set({
                hourlyRates: mergedRates,
                bonusRates: mergedBonuses
            });
        });
    }
}

function initializeRateScraping() {
    setTimeout(scrapeAndCacheRates, 2000);

    const observer = new MutationObserver(() => {
        scrapeAndCacheRates();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// ============== Initialize ==============

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeRateScraping();
        checkForActiveSession();
    });
} else {
    initializeRateScraping();
    checkForActiveSession();
}
