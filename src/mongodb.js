const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// TEMPORARY DEBUG URI - REMOVE AFTER TESTING
const atlasUri = process.env.MONGODB_URI;
// Enhanced connection with debugging
mongoose.connect(atlasUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
    retryWrites: true,
    w: 'majority'
})
.then(() => {
    console.log("✅ MongoDB connected to:", mongoose.connection.host);
    console.log("Database:", mongoose.connection.name);
})
.catch(err => {
    console.error("\n❌ CRITICAL CONNECTION FAILURE");
    console.error("Error:", err.message);
    console.log("\nREQUIRED FIXES:");
    console.log("1. WHITELIST IP: Go to Atlas → Network Access → Add 157.49.183.246");
    console.log("2. ROTATE PASSWORD: This password is exposed - change immediately in Atlas");
    console.log("3. VERIFY CLUSTER NAME: Confirm 'cluster0.yv2ljqc' matches your Atlas cluster");
    process.exit(1);
});

const LogInSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true,
        minlength: 8
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
});

LogInSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("User", LogInSchema);