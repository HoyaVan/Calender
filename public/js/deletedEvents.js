// Deleted Events Page JavaScript

// Auto-hide error message
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

// Auto-hide success message
function hideSuccessMessage() {
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        successMsg.style.transition = 'opacity 0.3s ease-out';
        successMsg.style.opacity = '0';
        setTimeout(() => {
            successMsg.remove();
        }, 300);
    }
}

// Restore event
async function restoreEvent(eventId) {
    if (!confirm('Are you sure you want to restore this event?')) {
        return;
    }

    try {
        const response = await fetch('/api/restore-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventId })
        });

        const data = await response.json();

        if (data.success) {
            // Reload the page to show updated list
            // Restore messages should be red (error), not green (success)
            window.location.href = '/deleted-events?error=' + encodeURIComponent(data.error || 'Event restored successfully');
        } else {
            console.error('Failed to restore event:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error restoring event:', error);
    }
}

// Permanently delete event
async function permanentlyDeleteEvent(eventId, eventName) {
    if (!confirm(`Are you sure you want to permanently delete "${eventName}"?\n\nThis action cannot be undone!`)) {
        return;
    }

    try {
        const response = await fetch('/api/permanently-delete-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventId })
        });

        const data = await response.json();

        if (data.success) {
            // Reload the page to show updated list
            // Delete messages should be red (error), not green (success)
            window.location.href = '/deleted-events?error=' + encodeURIComponent(data.error || 'Event permanently deleted');
        } else {
            console.error('Failed to permanently delete event:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error permanently deleting event:', error);
    }
}

// Auto-hide messages after 2.5 seconds
document.addEventListener('DOMContentLoaded', function() {
    // Clear URL parameters immediately
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('success')) {
        currentUrl.searchParams.delete('success');
        window.history.replaceState({}, document.title, currentUrl.toString());
    }

    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        setTimeout(hideErrorMessage, 2500);
    }

    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        setTimeout(hideSuccessMessage, 2500);
    }
});

