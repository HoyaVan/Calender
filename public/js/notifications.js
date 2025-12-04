// Notification System JavaScript
// This file handles all notification dropdown functionality and event display

let notificationDropdownOpen = false;

function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  notificationDropdownOpen = !notificationDropdownOpen;
  
  if (notificationDropdownOpen) {
    dropdown.classList.remove('hidden');
    loadCurrentEvents();
    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeNotificationsOnOutsideClick);
    }, 100);
  } else {
    dropdown.classList.add('hidden');
    document.removeEventListener('click', closeNotificationsOnOutsideClick);
  }
}

function closeNotificationsOnOutsideClick(event) {
  const dropdown = document.getElementById('notificationDropdown');
  const button = document.getElementById('notificationBtn');
  
  if (!dropdown.contains(event.target) && !button.contains(event.target)) {
    notificationDropdownOpen = false;
    dropdown.classList.add('hidden');
    document.removeEventListener('click', closeNotificationsOnOutsideClick);
  }
}

async function loadCurrentEvents() {
  const loadingEl = document.getElementById('notificationLoading');
  const emptyEl = document.getElementById('notificationEmpty');
  const eventsEl = document.getElementById('notificationEvents');
  const badgeEl = document.getElementById('notificationBadge');

  try {
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    eventsEl.classList.add('hidden');

    const response = await fetch('/api/current-events');
    const data = await response.json();

    loadingEl.classList.add('hidden');

    if (data.success && data.events && data.events.length > 0) {
      // Update badge
      badgeEl.textContent = data.events.length;
      badgeEl.classList.remove('hidden');

      // Display events
      eventsEl.innerHTML = '';
      data.events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsEl.appendChild(eventCard);
      });
      eventsEl.classList.remove('hidden');
    } else {
      // No events
      badgeEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading current events:', error);
    loadingEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    badgeEl.classList.add('hidden');
  }
}

function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'group bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer';
  
  const startTime = new Date(event.event_start);
  const endTime = new Date(event.event_end);
  
  // Format date
  const startDate = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endDate = endTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Format times
  const startTimeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTimeStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse flex-shrink-0 mt-0.5"></div>
        <h4 class="text-base font-bold text-gray-900 m-0 leading-tight">
          ${escapeHtml(event.event_name)}
        </h4>
      </div>
      ${event.security_level ? `
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white whitespace-nowrap shadow-sm flex-shrink-0">
          ${escapeHtml(event.security_level)}
        </span>
      ` : ''}
    </div>
    
    <div class="space-y-2 pl-4.5 mt-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-blue-600 min-w-[45px]">Start:</span>
        <span class="text-sm font-medium text-gray-700">${startDate} at ${startTimeStr}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-purple-600 min-w-[45px]">End:</span>
        <span class="text-sm font-medium text-gray-700">${endDate} at ${endTimeStr}</span>
      </div>
    </div>
  `;
  
  // Click to navigate to the event's date
  card.addEventListener('click', () => {
    const eventDate = startTime.toISOString().split('T')[0];
    window.location.href = `/?date=${eventDate}&view=day`;
  });
  
  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh notifications every 30 seconds
setInterval(() => {
  if (notificationDropdownOpen) {
    loadCurrentEvents();
  } else {
    // Still update badge count even when closed
    fetch('/api/current-events')
      .then(res => res.json())
      .then(data => {
        const badgeEl = document.getElementById('notificationBadge');
        if (data.success && data.events && data.events.length > 0) {
          badgeEl.textContent = data.events.length;
          badgeEl.classList.remove('hidden');
        } else {
          badgeEl.classList.add('hidden');
        }
      })
      .catch(err => console.error('Error updating notification badge:', err));
  }
}, 30000);

// Load initial badge count on page load
window.addEventListener('DOMContentLoaded', () => {
  fetch('/api/current-events')
    .then(res => res.json())
    .then(data => {
      const badgeEl = document.getElementById('notificationBadge');
      if (data.success && data.events && data.events.length > 0) {
        badgeEl.textContent = data.events.length;
        badgeEl.classList.remove('hidden');
      }
    })
    .catch(err => console.error('Error loading initial notifications:', err));
});

