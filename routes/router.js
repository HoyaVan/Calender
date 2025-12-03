const router = require("express").Router();
require("dotenv").config();

// Import auth routes
const loginRoutes = include('routes/auth/login');
const signupRoutes = include('routes/auth/signup');
const signoutRoutes = include('routes/auth/signout');
const friendsRoutes = include('routes/friends');

// Import database (using events for now, can be updated later)
const db_events = include('database/util/events');

// Expose common locals for all views
router.use((req, res, next) => {
  res.locals.authenticated = !!req.session.user;
  res.locals.username = req.session.user?.username || null;
  res.locals.displayName = res.locals.username;
  res.locals.avatar_url = req.session.user?.avatar_url || process.env.DEFAULT_AVATAR_URL || null;
  res.locals.default_avatar_url = process.env.DEFAULT_AVATAR_URL || '/images/default-avatar.png';
  next();
});

// Authentication middleware - redirect to login if not authenticated
const requireAuth = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  return res.redirect('/login');
};

// Use auth routes (these should be before requireAuth middleware)
router.use('/', loginRoutes);
router.use('/', signupRoutes);
router.use('/', signoutRoutes);
router.use('/', friendsRoutes);

// Test endpoint to verify MySQL connection (remove in production)
router.get('/test-mysql', async (req, res) => {
  try {
    const { pool, isMySQLConnected } = require('../database/connect_mysql');
    
    const isConnected = await isMySQLConnected();
    
    if (!isConnected) {
      return res.status(500).json({
        status: 'error',
        message: 'MySQL is not connected',
        connected: false
      });
    }
    
    // Get database info
    const connection = await pool.getConnection();
    const [dbRows] = await connection.query('SELECT DATABASE() as db, VERSION() as version');
    const dbName = dbRows[0]?.db || 'unknown';
    const dbVersion = dbRows[0]?.version || 'unknown';
    
    // Count users in database
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM user');
    const count = userCount[0]?.count || 0;
    
    connection.release();
    
    res.json({
      status: 'success',
      connected: true,
      database: {
        name: dbName,
        version: dbVersion,
        usersTable: {
          exists: true,
          recordCount: count
        }
      },
      message: 'MySQL connection is working correctly!'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      connected: false,
      message: 'MySQL connection test failed',
      error: error.message
    });
  }
});

// Keep /logout routes for backward compatibility (redirects to signout)
router.get('/logout', (req, res) => {
  res.redirect('/signout');
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }

    res.clearCookie('sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });

    res.redirect('/?loggedOut=true');
  });
});

// Home route - shows main page if authenticated, otherwise redirects to login
router.get("/", async (req, res) => {
  // If not authenticated, redirect to login
  if (!req.session?.user) {
    return res.redirect('/login');
  }

  // User is authenticated, show main page
  try {
    const userId = req.session.user.user_id;
    
    // Get view type from query parameter, default to 'day'
    const view = req.query.view || 'day';
    
    // Get date from query parameter, default to today
    let selectedDate = req.query.date;
    if (!selectedDate) {
      const today = new Date();
      selectedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selectedDate)) {
      const today = new Date();
      selectedDate = today.toISOString().split('T')[0];
    }
    
    const loggedOut = req.query.loggedOut === 'true';
    
    // Check if selected date is today (for day view) or current week (for week view)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let isToday = selectedDate === todayStr;
    
    let events = [];
    let weekData = null;
    let monthData = null;
    
    if (view === 'month') {
      // Calculate month dates
      const dateObj = new Date(selectedDate + 'T12:00:00');
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      
      // Get first day of the month
      const firstDay = new Date(year, month, 1);
      const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Get last day of the month
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      // Get the Sunday that starts the calendar grid (may be from previous month)
      const calendarStart = new Date(firstDay);
      calendarStart.setDate(firstDay.getDate() - firstDayOfWeek);
      
      // Get the Saturday that ends the calendar grid (may be from next month)
      const calendarEnd = new Date(calendarStart);
      calendarEnd.setDate(calendarStart.getDate() + 41); // 6 weeks * 7 days - 1
      
      const calendarStartStr = calendarStart.toISOString().split('T')[0];
      const calendarEndStr = new Date(calendarEnd.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Next day for exclusive range
      
      // Get all events for the month view range
      events = await db_events.getEventsByUserIdAndDateRange(userId, calendarStartStr, calendarEndStr);
      
      // Check if this month contains today
      const todayDate = new Date(todayStr + 'T12:00:00');
      isToday = todayDate.getFullYear() === year && todayDate.getMonth() === month;
      
      // Organize days into weeks
      const weeks = [];
      let currentDate = new Date(calendarStart);
      
      for (let week = 0; week < 6; week++) {
        const weekDays = [];
        for (let day = 0; day < 7; day++) {
          const dayStr = currentDate.toISOString().split('T')[0];
          const isCurrentMonth = currentDate.getMonth() === month && currentDate.getFullYear() === year;
          const isTodayDate = dayStr === todayStr;
          
          // Filter events for this day
          const dayEvents = events.filter(event => {
            const eventStart = new Date(event.event_start);
            const eventEnd = new Date(event.event_end);
            const dayStart = new Date(dayStr + 'T00:00:00');
            const dayEnd = new Date(dayStr + 'T23:59:59');
            return eventStart <= dayEnd && eventEnd >= dayStart;
          });
          
          weekDays.push({
            date: dayStr,
            dateObj: new Date(currentDate),
            dayNumber: currentDate.getDate(),
            isCurrentMonth: isCurrentMonth,
            isToday: isTodayDate,
            events: dayEvents
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        weeks.push(weekDays);
      }
      
      monthData = {
        year: year,
        month: month,
        monthName: dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        weeks: weeks
      };
    } else if (view === 'week') {
      // Calculate week dates (Sunday to Saturday)
      const dateObj = new Date(selectedDate + 'T12:00:00');
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Get Sunday of the week
      const sunday = new Date(dateObj);
      sunday.setDate(dateObj.getDate() - dayOfWeek);
      const sundayStr = sunday.toISOString().split('T')[0];
      
      // Check if this week contains today
      const todayDate = new Date(todayStr + 'T12:00:00');
      const todayDayOfWeek = todayDate.getDay();
      const todaySunday = new Date(todayDate);
      todaySunday.setDate(todayDate.getDate() - todayDayOfWeek);
      const todaySundayStr = todaySunday.toISOString().split('T')[0];
      
      // isToday is true if we're viewing the current week
      isToday = sundayStr === todaySundayStr;
      
      // Get Saturday of the week (end date is exclusive, so use next day)
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 7);
      const saturdayStr = saturday.toISOString().split('T')[0];
      
      // Get all events for the week
      events = await db_events.getEventsByUserIdAndDateRange(userId, sundayStr, saturdayStr);
      
      // Organize events by day
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        
        // Filter events for this day
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.event_start);
          const eventEnd = new Date(event.event_end);
          const dayStart = new Date(dayStr + 'T00:00:00');
          const dayEnd = new Date(dayStr + 'T23:59:59');
          return eventStart <= dayEnd && eventEnd >= dayStart;
        });
        
        weekDays.push({
          date: dayStr,
          dateObj: day,
          events: dayEvents
        });
      }
      
      weekData = {
        sunday: sundayStr,
        sundayDate: sunday,
        days: weekDays
      };
    } else {
      // Day view
      events = await db_events.getEventsByUserIdAndDate(userId, selectedDate);
    }

    res.render("main", {
      events,
      selectedDate,
      isToday,
      view,
      weekData,
      monthData,
      error: req.session.error,
      success: loggedOut ? 'You have been logged out successfully.' : req.session.success
    });
  } catch (error) {
    console.error("Error loading main page:", error);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    res.render("main", {
      events: [],
      selectedDate: todayStr,
      isToday: true,
      view: 'day',
      weekData: null,
      monthData: null,
      error: "Failed to load events",
      success: null
    });
  }
});

// Event creation routes - require authentication
router.get("/addEvent", requireAuth, async (req, res) => {
  try {
    const securityLevels = await db_events.getAllSecurityLevels();
    const error = req.session.error;
    const success = req.session.success;
    req.session.error = null;
    req.session.success = null;

    res.render("addEvent", {
      securityLevels,
      error,
      success
    });
  } catch (error) {
    console.error("Error loading add event page:", error);
    res.render("addEvent", {
      securityLevels: [],
      error: "Failed to load security levels",
      success: null
    });
  }
});

router.post("/addEvent", requireAuth, async (req, res) => {
  const { event_name, event_start, event_end, event_security_id } = req.body;
  const event_owner_id = req.session.user.user_id;

  // Basic validation
  if (!event_name || !event_start || !event_end || !event_security_id) {
    req.session.error = "All fields are required";
    return res.redirect("/addEvent");
  }

  // Validate event name length
  if (event_name.trim().length > 45) {
    req.session.error = "Event name must be 45 characters or less";
    return res.redirect("/addEvent");
  }

  // Validate dates
  const startDate = new Date(event_start);
  const endDate = new Date(event_end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    req.session.error = "Invalid date format";
    return res.redirect("/addEvent");
  }

  if (endDate <= startDate) {
    req.session.error = "Event end time must be after event start time";
    return res.redirect("/addEvent");
  }

  try {
    const event = await db_events.createEvent({
      event_name,
      event_start,
      event_end,
      event_owner_id,
      event_security_id: parseInt(event_security_id)
    });

    if (event) {
      req.session.success = "Event created successfully!";
      return res.redirect("/");
    } else {
      req.session.error = "Failed to create event";
      return res.redirect("/addEvent");
    }
  } catch (error) {
    console.error("Error creating event:", error);
    req.session.error = error.message || "An error occurred while creating the event";
    return res.redirect("/addEvent");
  }
});

// API endpoint to get current events (for notifications)
router.get("/api/current-events", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const currentEvents = await db_events.getCurrentEvents(userId);
    
    return res.json({
      success: true,
      events: currentEvents
    });
  } catch (error) {
    console.error("Error fetching current events:", error);
    return res.json({
      success: false,
      events: [],
      error: "Failed to fetch current events"
    });
  }
});

// Catch-all 404 handler - must be last
router.use((req, res) => {
  res.status(404).render("404");
});

module.exports = router;
