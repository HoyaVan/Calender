// Deleted Events Page JavaScript
// Message handling is now in message-handler.js

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

// Message auto-hide is handled by message-handler.js

