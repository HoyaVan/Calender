// Profile Page JavaScript
// Handles user search and friend request functionality

/**
 * Handle user search form submission
 */
function initProfileSearch() {
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) return;

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchTerm = document.getElementById('searchInput').value.trim();
        const resultsDiv = document.getElementById('searchResults');

        if (!searchTerm) {
            resultsDiv.innerHTML = '<p class="text-gray-500">Please enter a search term.</p>';
            return;
        }

        resultsDiv.innerHTML = '<p class="text-gray-500">Searching...</p>';

        try {
            const response = await fetch('/friends/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `searchTerm=${encodeURIComponent(searchTerm)}`
            });

            const data = await response.json();

            if (data.success && data.users.length > 0) {
                let html = '<div class="space-y-2">';
                data.users.forEach(user => {
                    const requestStatus = user.request_status || 'none';
                    let actionButton = '';
                    
                    if (requestStatus === 'friend') {
                        // User is already a friend
                        actionButton = '<span class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">Already Friends</span>';
                    } else if (requestStatus === 'sent') {
                        // User already sent a request to this user
                        actionButton = '<span class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">Request Sent</span>';
                    } else if (requestStatus === 'received') {
                        // This user sent a request to current user (should show in pending requests)
                        actionButton = '<span class="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">Check Pending Requests</span>';
                    } else {
                        // No request exists, show send button
                        actionButton = `
                            <form action="/friends/send-request" method="POST" class="inline">
                                <input type="hidden" name="receiveUserId" value="${user.user_id}">
                                <button 
                                    type="submit" 
                                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                                >
                                    Send Request
                                </button>
                            </form>
                        `;
                    }
                    
                    html += `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">${escapeHtml(user.username)}</p>
                                <p class="text-sm text-gray-500">${escapeHtml(user.email)}</p>
                            </div>
                            ${actionButton}
                        </div>
                    `;
                });
                html += '</div>';
                resultsDiv.innerHTML = html;
            } else {
                resultsDiv.innerHTML = '<p class="text-gray-500">No users found.</p>';
            }
        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = '<p class="text-red-500">Error searching users. Please try again.</p>';
        }
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initProfileSearch();
});

