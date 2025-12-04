// Add Event Form JavaScript
// This file handles all functionality for the event creation form

// Use friendsData from window (initialized from server in EJS template)
const friendsData = window.friendsData || [];

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

// Helper function to combine date and time into datetime-local format
function combineDateTime(dateInput, timeInput) {
    if (!dateInput.value || !timeInput.value) {
        return '';
    }
    return dateInput.value + 'T' + timeInput.value;
}

// Helper function to set today's date as default
function setTodayDate(dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

// Toggle dropdown visibility
function toggleDropdown() {
    const dropdown = document.getElementById('friend-dropdown');
    const arrow = document.getElementById('dropdown-arrow');
    
    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('top-full', 'mt-1');
        arrow.classList.add('transform', 'rotate-180');
        
        // Small delay to ensure dropdown is visible before focusing
        setTimeout(() => {
            const searchInput = document.getElementById('friend-search');
            if (searchInput) {
                searchInput.focus();
            }
        }, 10);
    } else {
        dropdown.classList.add('hidden');
        arrow.classList.remove('transform', 'rotate-180');
    }
}

// Filter friends list based on search term
function filterFriends() {
    const searchTerm = document.getElementById('friend-search').value.toLowerCase();
    const friendItems = document.querySelectorAll('.friend-item');
    const noResults = document.getElementById('no-results');
    let visibleCount = 0;

    friendItems.forEach(item => {
        const username = item.getAttribute('data-username');
        const email = item.getAttribute('data-email');
        const matches = username.includes(searchTerm) || email.includes(searchTerm);
        
        if (matches) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Show/hide no results message
    if (visibleCount === 0 && searchTerm.length > 0) {
        if (noResults) {
            noResults.classList.remove('hidden');
        }
    } else {
        if (noResults) {
            noResults.classList.add('hidden');
        }
    }
}

// Update selected friends display
function updateSelectedFriends() {
    const checkboxes = document.querySelectorAll('.friend-checkbox:checked');
    const selectedTags = document.getElementById('selected-tags');
    const placeholder = document.getElementById('placeholder-text');
    
    if (!selectedTags || !placeholder) return;
    
    selectedTags.innerHTML = '';
    
    if (checkboxes.length === 0) {
        placeholder.style.display = 'block';
    } else {
        placeholder.style.display = 'none';
        
        checkboxes.forEach(checkbox => {
            const friendId = parseInt(checkbox.value);
            const friend = friendsData.find(f => f.id === friendId);
            
            if (friend) {
                const tag = document.createElement('span');
                tag.className = 'inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm';
                tag.innerHTML = `
                    ${escapeHtml(friend.username)}
                    <button type="button" 
                            onclick="removeFriend(${friend.id}); event.stopPropagation();" 
                            class="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                `;
                selectedTags.appendChild(tag);
            }
        });
    }
}

// Remove friend from selection
function removeFriend(friendId) {
    const checkbox = document.querySelector(`.friend-checkbox[value="${friendId}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateSelectedFriends();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide error message after 5 seconds
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        setTimeout(hideErrorMessage, 5000);
    }

    // Auto-hide success message after 5 seconds
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        setTimeout(hideSuccessMessage, 5000);
    }

    // Get date and time inputs
    const startDateInput = document.getElementById('event_start_date');
    const startTimeInput = document.getElementById('event_start_time');
    const endDateInput = document.getElementById('event_end_date');
    const endTimeInput = document.getElementById('event_end_time');
    const startHiddenInput = document.getElementById('event_start');
    const endHiddenInput = document.getElementById('event_end');

    if (!startDateInput || !startTimeInput || !endDateInput || !endTimeInput || !startHiddenInput || !endHiddenInput) {
        return; // Form elements not found, might be on a different page
    }

    // Set default dates to today
    setTodayDate(startDateInput);
    setTodayDate(endDateInput);

    // Function to update hidden datetime inputs
    function updateHiddenInputs() {
        startHiddenInput.value = combineDateTime(startDateInput, startTimeInput);
        endHiddenInput.value = combineDateTime(endDateInput, endTimeInput);
    }

    // Update hidden inputs whenever date or time changes
    startDateInput.addEventListener('change', updateHiddenInputs);
    startTimeInput.addEventListener('change', updateHiddenInputs);
    endDateInput.addEventListener('change', updateHiddenInputs);
    endTimeInput.addEventListener('change', updateHiddenInputs);

    // Validate that end datetime is after start datetime
    function validateDateTime() {
        const startDateTime = combineDateTime(startDateInput, startTimeInput);
        const endDateTime = combineDateTime(endDateInput, endTimeInput);

        if (startDateTime && endDateTime) {
            const start = new Date(startDateTime);
            const end = new Date(endDateTime);

            if (end <= start) {
                alert('End date and time must be after start date and time');
                endTimeInput.value = '';
                endDateInput.value = startDateInput.value;
                updateHiddenInputs();
                return false;
            }
        }
        return true;
    }

    // Validate on form submit
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            updateHiddenInputs();
            if (!validateDateTime()) {
                e.preventDefault();
                return false;
            }
        });
    }

    // Validate when end date/time changes
    endDateInput.addEventListener('change', function() {
        if (!validateDateTime()) {
            this.value = startDateInput.value;
        }
        updateHiddenInputs();
    });

    endTimeInput.addEventListener('change', function() {
        if (!validateDateTime()) {
            this.value = '';
        }
        updateHiddenInputs();
    });

    // When start date changes, ensure end date is not before it
    startDateInput.addEventListener('change', function() {
        if (endDateInput.value && endDateInput.value < this.value) {
            endDateInput.value = this.value;
        }
        updateHiddenInputs();
    });

    // When start time changes, validate end time if dates are the same
    startTimeInput.addEventListener('change', function() {
        if (startDateInput.value === endDateInput.value) {
            if (endTimeInput.value && endTimeInput.value <= this.value) {
                endTimeInput.value = '';
            }
        }
        updateHiddenInputs();
    });

    // Initialize hidden inputs
    updateHiddenInputs();


    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const container = document.getElementById('friend-selector-container');
        if (container && !container.contains(event.target)) {
            const dropdown = document.getElementById('friend-dropdown');
            const arrow = document.getElementById('dropdown-arrow');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                if (arrow) {
                    arrow.classList.remove('transform', 'rotate-180');
                }
            }
        }
    });

    // Prevent dropdown from closing when clicking inside it
    const friendDropdown = document.getElementById('friend-dropdown');
    if (friendDropdown) {
        friendDropdown.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
});

