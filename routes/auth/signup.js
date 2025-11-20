const router = require("express").Router();
const bcrypt = require("bcrypt");
const db_users = include('database/util/users');  // Changed from utils to util
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
    // Normalize inputs for checking
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();
    
    // Check if email already exists
    const existingEmail = await db_users.getUser({ email: normalizedEmail });
    if (existingEmail) {
      req.session.error = "This email is already registered. Please use a different email or try logging in.";
      return res.redirect("/signup");
    }
    
    // Check if username already exists
    const existingUsername = await db_users.getUser({ user: normalizedUsername });
    if (existingUsername) {
      req.session.error = "This username is already taken. Please choose a different username.";
      return res.redirect("/signup");
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const success = await db_users.createUser({ email, user: username, hashedPassword: passwordHash });
    if (!success) {
      req.session.error = "Database Error! Please contact server administrators.";
      return res.redirect("/signup");
    }

    // Get the newly created user to get their user_id
    const newUser = await db_users.getUser({ email });
    
    // Regenerate session ID to create a new session for the new user
    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session:', err);
        req.session.error = "Account created but login failed. Please try logging in.";
        return res.redirect("/login");
      }

      // Log them in right away
      req.session.user = {
        user_id: newUser.user_id,  // MySQL uses user_id
        username: newUser.username,
        email: newUser.email,
        avatar_url: newUser.avatar_url || process.env.DEFAULT_AVATAR_URL || null
      };
      req.session.cookie.maxAge = expireTime;

      return res.redirect("/");
    });
  } catch (error) {
    // MySQL duplicate key error code is ER_DUP_ENTRY (1062)
    if (error?.code === 'ER_DUP_ENTRY') {
      req.session.error = "Email or username already exists. Please try another.";
      return res.redirect("/signup");
    }
    console.error("Error during signup:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
