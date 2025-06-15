const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const User = require("./mongodb");
const bcrypt = require("bcryptjs");

// Initialize view engine FIRST
const templatesPath = path.join(__dirname, '../templates');
app.set("view engine", "hbs");
app.set("views", templatesPath);

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => res.render("login"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).send("All fields are required");
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        
        res.render("home", {
            message: "Signup successful!",
            user: newUser,
            isLogin: false
        });
    } catch (err) {
        console.error("Signup error:", err);
        if (err.code === 11000) {
            return res.status(400).render("signup", { error: "Email already exists" });
        }
        res.status(500).render("signup", { error: "Signup failed. Please try again." });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", email); // Shows in terminal
        
        // Check if user exists in MongoDB
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send("User not found");
        }
        
        // Verify password (if using hashed passwords)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid credentials");
        }
        
        // If everything is correct, render home page
        res.render('home', { 
            message: "Login successful!",
            isLogin: true,
            user: { name: user.name, email: user.email }
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.post('/logout', (req, res) => {
  res.redirect('/login'); // Simple redirect without session handling
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});