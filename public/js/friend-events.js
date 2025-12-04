// Friend Events Management JavaScript
// Handles friend events toggle, filtering, and selection

/**
 * Toggle friend events visibility
 */
function toggleFriendEvents() {
    const currentUrl = new URL(window.location.href);
    const showFriendEvents = currentUrl.searchParams.get('showFriendEvents') === 'true';
    
    if (showFriendEvents) {
        currentUrl.searchParams.delete('showFriendEvents');
        currentUrl.searchParams.delete('selectedFriends');
    } else {
        currentUrl.searchParams.set('showFriendEvents', 'true');
    }
    
    // Reload page to apply changes
    window.location.href = currentUrl.toString();
}

/**
 * Toggle friend selector popup visibility
 */
function toggleFriendSelectorPopup() {
    const popup = document.getElementById('friendSelectorPopup');
    const backdrop = document.getElementById('friendSelectorBackdrop');
    if (popup) {
        popup.classList.toggle('hidden');
    }
    if (backdrop) {
        backdrop.classList.toggle('hidden');
    }
}

/**
 * Toggle select all friends checkbox
 */
function toggleSelectAllFriends() {
    const selectAllCheckbox = document.getElementById('selectAllFriends');
    const friendCheckboxes = document.querySelectorAll('input[name="friendCheckbox"]');
    const isChecked = selectAllCheckbox.checked;
    
    friendCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    // Update label
    const selectAllLabel = document.getElementById('selectAllLabel');
    if (selectAllLabel) {
        selectAllLabel.textContent = isChecked ? 'All' : 'Select All';
    }
    
    updateFriendSelection();
}

/**
 * Update friend selection and reload page to filter events
 */
function updateFriendSelection() {
    const friendCheckboxes = document.querySelectorAll('input[name="friendCheckbox"]:checked');
    const selectedIds = Array.from(friendCheckboxes).map(cb => parseInt(cb.value));
    const allCheckboxes = document.querySelectorAll('input[name="friendCheckbox"]');
    
    // Update select all checkbox state and label
    const selectAllCheckbox = document.getElementById('selectAllFriends');
    const selectAllLabel = document.getElementById('selectAllLabel');
    if (selectAllCheckbox && selectAllLabel) {
        const allSelected = selectedIds.length === allCheckboxes.length;
        const noneSelected = selectedIds.length === 0;
        selectAllCheckbox.checked = allSelected || noneSelected;
        selectAllLabel.textContent = (allSelected || noneSelected) ? 'All' : 'Select All';
    }
    
    // Update URL with selected friends
    const currentUrl = new URL(window.location.href);
    if (selectedIds.length === 0) {
        // If none selected, set empty string to show none
        currentUrl.searchParams.set('selectedFriends', '');
    } else if (selectedIds.length === allCheckboxes.length) {
        // If all selected, remove parameter (show all by default)
        currentUrl.searchParams.delete('selectedFriends');
    } else {
        // Some selected - set the comma-separated list
        currentUrl.searchParams.set('selectedFriends', selectedIds.join(','));
    }
    
    // Reload page to apply filtering
    window.location.href = currentUrl.toString();
}

