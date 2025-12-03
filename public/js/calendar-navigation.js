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
  window.location.href = `/?date=${newDate}&view=${window.calendarState.currentView}`;
}

// Navigate to a different week
function changeWeek(weeks) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setDate(date.getDate() + (weeks * 7));
  const newDate = date.toISOString().split('T')[0];
  window.location.href = `/?date=${newDate}&view=week`;
}

// Navigate to a different month
function changeMonth(months) {
  const date = new Date(window.calendarState.currentDate + 'T12:00:00');
  date.setMonth(date.getMonth() + months);
  const newDate = date.toISOString().split('T')[0];
  window.location.href = `/?date=${newDate}&view=month`;
}

// Navigate to today (current day/week/month)
function goToToday() {
  window.location.href = `/?view=${window.calendarState.currentView}`;
}

// Switch to day view
function switchToDayView() {
  window.location.href = `/?date=${window.calendarState.currentDate}&view=day`;
}

// Switch to week view
function switchToWeekView() {
  window.location.href = `/?date=${window.calendarState.currentDate}&view=week`;
}

// Switch to month view
function switchToMonthView() {
  window.location.href = `/?date=${window.calendarState.currentDate}&view=month`;
}

