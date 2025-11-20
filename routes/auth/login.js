const router = require("express").Router();
const bcrypt = require("bcrypt");
const db_users = include('database/util/users');
const validation = include('auth/validation');
require("dotenv").config();

const expireTime = 1 * 60 * 60 * 1000;

router.get("/login", (req, res) => {
  console.log("Login route accessed");
  // If already logged in, redirect to home
  if (req.session?.user) {
    return res.redirect('/');
  }
  
  const error = req.session.error;
  req.session.error = null;
  
  try {
    console.log("Rendering login view");
    res.render("login", { error });
  } catch (err) {
    console.error("Error rendering login page:", err);
    res.status(500).send("Error loading login page: " + err.message);
  }
});

router.post('/submitLogin', async (req, res) => {
  const { email, password } = req.body;

  const loginResult = validation.validateLogin({ email, password });
  if (loginResult.error) {
    req.session.error = validation.formatValidationErrors(loginResult);
    return res.redirect("/login");
  }

  try {
    const user = await db_users.getUser({ user: null, email });
    if (!user) {
      req.session.error = "This e-mail or username could not be found. Please enter a valid e-mail address.";
      return res.redirect("/login");
    }
    if (!(await bcrypt.compare(password, user.password_hash))) {
      req.session.error = "Incorrect password! Please try again.";
      return res.redirect("/login");
    }

    // Regenerate session ID to prevent session fixation and create a new session
    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session:', err);
        return res.render("login", { error: "An error occurred. Please try again." });
      }

      // set session - MySQL uses user_id
      req.session.user = {
        user_id: user.user_id,  // MySQL uses user_id
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url || process.env.DEFAULT_AVATAR_URL || null
      };
      req.session.cookie.maxAge = expireTime;

      // >>> redirect to home page after successful login
      return res.redirect("/");
    });
  } catch (error) {
    console.log("Login error:", error);
    return res.render("login", { error: "An error occurred. Please try again." });
  }
});

module.exports = router;
