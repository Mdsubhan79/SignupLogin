require('dotenv').config(); // Load environment variables first
const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const User = require("./mongodb");
const bcrypt = require("bcryptjs");
const session = require('express-session'); // Added for session management
const flash = require('connect-flash'); // For flash messages

// Configuration
const PORT = process.env.PORT || 3000;
const templatesPath = path.join(__dirname, '../templates');

// Initialize view engine
app.set("view engine", "hbs");
app.set("views", templatesPath);

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Routes
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render("login", { error: req.flash('error') });
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render("login", { error: req.flash('error') });
});

app.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render("signup", { error: req.flash('error') });
});

app.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render("home", { 
    user: req.session.user,
    isLogin: true
  });
});

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/signup');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already exists');
      return res.redirect('/signup');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword 
    });

    await newUser.save();
    
    // Set session and redirect
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email
    };
    
    req.flash('success_msg', 'Signup successful!');
    res.redirect('/home');
    
  } catch (err) {
    console.error("Signup error:", err);
    req.flash('error', 'Signup failed. Please try again.');
    res.redirect('/signup');
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
    
    // Set session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    req.flash('success_msg', 'Login successful!');
    res.redirect('/home');
    
  } catch (err) {
    console.error("Login error:", err);
    req.flash('error', 'Server error');
    res.redirect('/login');
  }
});

// Logout Route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});