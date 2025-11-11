const router = require("express").Router();
const bcrypt = require("bcrypt");
const db_users = include('database/utils/users');
const validation = include('auth/validation');
require("dotenv").config();

const expireTime = 1 * 60 * 60 * 1000;
const saltRounds = 12;

router.get("/signup", (req, res) => {
  // If already logged in, redirect to home
  if (req.session?.user) {
    return res.redirect('/');
  }
  
  const error = req.session.error;
  req.session.error = null;
  res.render("signup", { error });
});

router.post("/submitSignup", async (req, res) => {
  const { username, email, password } = req.body;

  const validationResult = validation.validateSignup({ username, email, password });
  if (validationResult.error) {
    req.session.error = validation.formatValidationErrors(validationResult);
    return res.redirect("/signup");
  }

  try {
    const existingUser = await db_users.getUser({ user: username, email });
    if (existingUser) {
      req.session.error = "Email or username already exists. Please try again.";
      return res.redirect("/signup");
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const success = await db_users.createUser({ email, user: username, hashedPassword: passwordHash });
    if (!success) {
      req.session.error = "Database Error! Please contact server administrators.";
      return res.redirect("/signup");
    }

    // Optional: log them in right away
    req.session.user = {
      user_id: null,
      username,
      email,
      avatar_url: process.env.DEFAULT_AVATAR_URL || null
    };
    req.session.cookie.maxAge = expireTime;


    return res.redirect("/");
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      req.session.error = "Email or username already exists. Please try another.";
      return res.redirect("/signup");
    }
    console.error("Error during signup:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
