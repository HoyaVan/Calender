const router = require("express").Router();
const bcrypt = require("bcrypt");
const db_users = include('database/utils/users');
const validation = include('auth/validation');
require("dotenv").config();

const expireTime = 1 * 60 * 60 * 1000;

router.get("/login", (req, res) => {
  // If already logged in, redirect to home
  if (req.session?.user) {
    return res.redirect('/');
  }
  
  const error = req.session.error;
  req.session.error = null;
  res.render("login", { error });
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

    // set session
    req.session.user = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url || process.env.DEFAULT_AVATAR_URL || null
    };
    req.session.cookie.maxAge = expireTime;


    // >>> redirect to home page after successful login
    return res.redirect("/");
  } catch (error) {
    console.log("Login error:", error);
    return res.render("login", { error: "An error occurred. Please try again." });
  }
});

module.exports = router;
