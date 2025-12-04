// Event Actions JavaScript
// Handles event deletion and other event-related actions

/**
 * Delete an event (moves it to deleted events page)
 * @param {number} eventId - The ID of the event to delete
 * @param {string} eventName - The name of the event (for confirmation)
 */
async function deleteEvent(eventId, eventName) {
    if (!confirm(`Are you sure you want to delete "${eventName}"?\n\nThis will move it to the deleted events page where you can restore it within 7 days.`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete-event', {
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
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('error', data.error || 'Event deleted successfully');
            window.location.href = currentUrl.toString();
        }
    } catch (error) {
        console.error('Error deleting event:', error);
    }
}

