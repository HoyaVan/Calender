// Message Handler Utility
// Shared utility for handling success and error messages across all pages

/**
 * Hide success message with fade-out animation
 */
function hideSuccessMessage() {
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        successMsg.style.transition = 'opacity 0.3s ease-out';
        successMsg.style.opacity = '0';
        setTimeout(() => {
            successMsg.remove();
            // Remove success from URL if present
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.has('success')) {
                currentUrl.searchParams.delete('success');
                window.history.replaceState({}, document.title, currentUrl.toString());
            }
        }, 300);
    }
}

/**
 * Hide error message with fade-out animation
 */
function hideErrorMessage() {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.style.transition = 'opacity 0.3s ease-out';
        errorMsg.style.opacity = '0';
        setTimeout(() => {
            errorMsg.remove();
        }, 300);
    }
}

/**
 * Initialize auto-hide for messages on page load
 */
function initMessageAutoHide() {
    document.addEventListener('DOMContentLoaded', function() {
        // Clear URL parameters immediately
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('success')) {
            currentUrl.searchParams.delete('success');
            window.history.replaceState({}, document.title, currentUrl.toString());
        }

        const successMsg = document.getElementById('success-message');
        if (successMsg) {
            setTimeout(hideSuccessMessage, 2500);
        }

        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            setTimeout(hideErrorMessage, 2500);
        }
    });
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMessageAutoHide);
} else {
    initMessageAutoHide();
}

