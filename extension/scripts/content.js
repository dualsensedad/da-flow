// DA Flow Content Script - Auto-Detection for DataAnnotation.tech
// Target: https://app.dataannotation.tech

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getProjectTitle') {
        const title = extractProjectTitle();
        sendResponse({ title: title });
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
        // Skip generic headers like "Projects", "Qualifications"
        if (text.length > 0 && text.length < 100 &&
            !['Projects', 'Qualifications', 'Overview'].includes(text)) {
            return text;
        }
    }

    // Fallback: Try to extract from task links on dashboard
    const taskLink = document.querySelector('tr a[href^="/workers/tasks"]');
    if (taskLink && taskLink.textContent) {
        return taskLink.textContent.trim();
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
