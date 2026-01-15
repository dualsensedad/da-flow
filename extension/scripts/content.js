// DA Flow Content Script - Auto-Detection for DataAnnotation.tech
// Target: https://app.dataannotation.tech

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getProjectTitle') {
        const title = extractProjectTitle();
        sendResponse({ title: title });
    }
    if (message.action === 'getProjectInfo') {
        const info = extractProjectInfo();
        sendResponse(info);
    }
    return true;
});

function extractProjectTitle() {
    // Primary: Get project title from breadcrumb (confirmed via DOM inspection)
    const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
    if (breadcrumbActive && breadcrumbActive.textContent) {
        return breadcrumbActive.textContent.trim();
    }

    // Alternative: Breadcrumb last item via aria-label
    const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
    if (breadcrumbNav) {
        const lastItem = breadcrumbNav.querySelector('li:last-child');
        if (lastItem && lastItem.textContent) {
            return lastItem.textContent.trim();
        }
    }

    // Fallback: Try h3 tags with Tailwind classes (used for section headers)
    const h3s = document.querySelectorAll('h3.tw-text-h3, h3[class*="tw-text"]');
    for (const h3 of h3s) {
        const text = h3.textContent.trim();
        if (text.length > 0 && text.length < 100 &&
            !['Projects', 'Qualifications', 'Overview'].includes(text)) {
            return text;
        }
    }

    // Last resort: Clean page title
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
    const rate = extractPayRate();
    return { title, rate };
}

function extractPayRate() {
    // Get project_id from URL if on task page
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    // If on dashboard, scrape rates and cache them
    if (window.location.pathname.includes('/workers/projects') ||
        window.location.pathname === '/workers' ||
        window.location.pathname === '/') {
        scrapeAndCacheRates();
    }

    // Try to find rate from cached data using project name
    return null; // Will be looked up from storage by popup
}

function scrapeAndCacheRates() {
    const projectRates = {};

    // Find all project rows in the table
    const rows = document.querySelectorAll('tr');

    rows.forEach(row => {
        // Find the project link
        const link = row.querySelector('a[href*="project_id="], a[href*="/workers/tasks"]');
        if (!link) return;

        const projectName = link.textContent.trim();
        if (!projectName) return;

        // Find the pay rate cell - look for text matching $XX.XX/hr pattern
        const cells = row.querySelectorAll('td');
        for (const cell of cells) {
            const text = cell.textContent.trim();
            const rateMatch = text.match(/\$(\d+\.?\d*)\/?hr/i);
            if (rateMatch) {
                projectRates[projectName] = parseFloat(rateMatch[1]);
                break;
            }
        }
    });

    // Save to chrome.storage if we found any rates
    if (Object.keys(projectRates).length > 0) {
        chrome.storage.local.get(['hourlyRates'], (result) => {
            const existingRates = result.hourlyRates || {};
            const mergedRates = { ...existingRates, ...projectRates };
            chrome.storage.local.set({ hourlyRates: mergedRates });
        });
    }
}

// Auto-scrape rates when on dashboard
function initializeRateScraping() {
    // Wait for page to load, then scrape
    setTimeout(scrapeAndCacheRates, 2000);

    // Also watch for dynamic content changes
    const observer = new MutationObserver(() => {
        scrapeAndCacheRates();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRateScraping);
} else {
    initializeRateScraping();
}
