// DA Flow Content Script - Auto-Detection for DataAnnotation.tech

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getProjectTitle') {
        const title = extractProjectTitle();
        sendResponse({ title: title });
    }
    return true;
});

function extractProjectTitle() {
    // Try to get project title from H1 tag
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent) {
        return h1.textContent.trim();
    }

    // Fallback: try common selectors for project titles
    const selectors = [
        '[data-testid="project-title"]',
        '.project-title',
        '.task-title',
        'h2',
        '.header-title'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            const text = element.textContent.trim();
            if (text.length > 0 && text.length < 100) {
                return text;
            }
        }
    }

    // Last resort: use page title
    if (document.title) {
        return document.title.replace(' - DataAnnotation', '').trim();
    }

    return '';
}

// Optional: Auto-notify background when project changes
let lastProjectTitle = '';

function watchForProjectChanges() {
    const observer = new MutationObserver(() => {
        const currentTitle = extractProjectTitle();
        if (currentTitle && currentTitle !== lastProjectTitle) {
            lastProjectTitle = currentTitle;
            // Could send to background if needed
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForProjectChanges);
} else {
    watchForProjectChanges();
}
