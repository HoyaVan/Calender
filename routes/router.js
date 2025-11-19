const router = require("express").Router();
require("dotenv").config();

// Import auth routes
const loginRoutes = include('routes/auth/login');
const signupRoutes = include('routes/auth/signup');
const signoutRoutes = include('routes/auth/signout');

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
      secure: process.env.NODE_ENV === 'production'
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

// Catch-all 404 handler - must be last
router.use((req, res) => {
  res.status(404).render("404");
});

module.exports = router;
