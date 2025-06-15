// mongodb.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect("mongodb://localhost:27017/LoginSignup", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

const LogInSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }
});

LogInSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 8); 
    next();
});

module.exports = mongoose.model("User", LogInSchema);