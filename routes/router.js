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
    const events = await db_events.getAllEvents(); // reveal events
    const loggedOut = req.query.loggedOut === 'true';

    res.render("main", {
      events,
      error: req.session.error,
      success: loggedOut ? 'You have been logged out successfully.' : req.session.success
    });
  } catch (error) {
    console.error("Error loading main page:", error);
    res.render("main", {
      events: [],
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

// Catch-all 404 handler - must be last
router.use((req, res) => {
  res.status(404).render("404");
});

module.exports = router;
