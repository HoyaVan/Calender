const router = require("express").Router();
require("dotenv").config();

// GET signout route
router.get('/signout', (req, res) => {
  // Get the session ID before destroying
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }

    // Clear the session cookie (options must match session config exactly)
    res.clearCookie('sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });

    // Redirect to home page with success message
    res.redirect('/?loggedOut=true');
  });
});

// POST signout route (for form submissions)
router.post('/signout', (req, res) => {
  const sessionId = req.sessionID;

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

module.exports = router;
