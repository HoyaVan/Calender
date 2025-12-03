// Deleted Events Page JavaScript

// Auto-hide error message
function hideErrorMessage() {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.style.transition = 'opacity 0.5s ease-out';
        errorMsg.style.opacity = '0';
        setTimeout(() => {
            errorMsg.remove();
        }, 500);
    }
}

// Auto-hide success message
function hideSuccessMessage() {
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        successMsg.style.transition = 'opacity 0.5s ease-out';
        successMsg.style.opacity = '0';
        setTimeout(() => {
            successMsg.remove();
        }, 500);
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
            window.location.href = '/deleted-events?success=' + encodeURIComponent(data.message);
        } else {
            alert('Error: ' + (data.error || 'Failed to restore event'));
        }
    } catch (error) {
        console.error('Error restoring event:', error);
        alert('An error occurred while restoring the event');
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
            window.location.href = '/deleted-events?success=' + encodeURIComponent(data.message);
        } else {
            alert('Error: ' + (data.error || 'Failed to permanently delete event'));
        }
    } catch (error) {
        console.error('Error permanently deleting event:', error);
        alert('An error occurred while permanently deleting the event');
    }
}

// Auto-hide messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        setTimeout(hideErrorMessage, 5000);
    }

    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        setTimeout(hideSuccessMessage, 5000);
    }

    // Check for success message in URL
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    if (successParam) {
        // Update the URL to remove the success parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

