// Calendar Navigation JavaScript
// This file handles all calendar view navigation and date manipulation

// Initialize calendar navigation with current date and view
function initCalendarNavigation(currentDate, currentView) {
  window.calendarState = {
    currentDate: currentDate,
    currentView: currentView
  };
}

/**
 * Build URL with preserved query parameters
 * @param {string} baseUrl - Base URL with date and view parameters
 * @returns {string} Complete URL with preserved friend events parameters
 */
function buildCalendarUrl(baseUrl) {
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  
  let url = baseUrl;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  return url;
}

// Navigate to a different day
function changeDay(days) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const newDate = date.toISOString().split('T')[0];
  const baseUrl = `/?date=${newDate}&view=${window.calendarState.currentView}`;
  window.location.href = buildCalendarUrl(baseUrl);
}

// Navigate to a different week
function changeWeek(weeks) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setDate(date.getDate() + (weeks * 7));
  const newDate = date.toISOString().split('T')[0];
  const baseUrl = `/?date=${newDate}&view=week`;
  window.location.href = buildCalendarUrl(baseUrl);
}

// Navigate to a different month
function changeMonth(months) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setMonth(date.getMonth() + months);
  const newDate = date.toISOString().split('T')[0];
  const baseUrl = `/?date=${newDate}&view=month`;
  window.location.href = buildCalendarUrl(baseUrl);
}

// Navigate to today (current day/week/month)
function goToToday() {
  const baseUrl = `/?view=${window.calendarState.currentView}`;
  window.location.href = buildCalendarUrl(baseUrl);
}

// Switch to day view
function switchToDayView() {
  const baseUrl = `/?date=${window.calendarState.currentDate}&view=day`;
  window.location.href = buildCalendarUrl(baseUrl);
}

// Switch to week view
function switchToWeekView() {
  const baseUrl = `/?date=${window.calendarState.currentDate}&view=week`;
  window.location.href = buildCalendarUrl(baseUrl);
}

// Switch to month view
function switchToMonthView() {
  const baseUrl = `/?date=${window.calendarState.currentDate}&view=month`;
  window.location.href = buildCalendarUrl(baseUrl);
}

