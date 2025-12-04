// Calendar Navigation JavaScript
// This file handles all calendar view navigation and date manipulation

// Initialize calendar navigation with current date and view
function initCalendarNavigation(currentDate, currentView) {
  window.calendarState = {
    currentDate: currentDate,
    currentView: currentView
  };
}

// Navigate to a different day
function changeDay(days) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const newDate = date.toISOString().split('T')[0];
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?date=${newDate}&view=${window.calendarState.currentView}`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

// Navigate to a different week
function changeWeek(weeks) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setDate(date.getDate() + (weeks * 7));
  const newDate = date.toISOString().split('T')[0];
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?date=${newDate}&view=week`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

// Navigate to a different month
function changeMonth(months) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setMonth(date.getMonth() + months);
  const newDate = date.toISOString().split('T')[0];
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?date=${newDate}&view=month`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

// Navigate to today (current day/week/month)
function goToToday() {
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?view=${window.calendarState.currentView}`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

// Switch to day view
function switchToDayView() {
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?date=${window.calendarState.currentDate}&view=day`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

// Switch to week view
function switchToWeekView() {
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?date=${window.calendarState.currentDate}&view=week`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

// Switch to month view
function switchToMonthView() {
  const currentUrl = new URL(window.location.href);
  const showFriendEvents = currentUrl.searchParams.get('showFriendEvents');
  const selectedFriends = currentUrl.searchParams.get('selectedFriends');
  let url = `/?date=${window.calendarState.currentDate}&view=month`;
  if (showFriendEvents) url += `&showFriendEvents=${showFriendEvents}`;
  if (selectedFriends) url += `&selectedFriends=${selectedFriends}`;
  window.location.href = url;
}

