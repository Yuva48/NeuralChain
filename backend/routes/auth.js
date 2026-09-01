const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

const getJwtSecret = () => {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET !== "fallback_secret") {
        return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV !== "production") {
        return "neuralchain-dev-secret";
    }

    throw new Error("JWT_SECRET is required in production mode.");
};

const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const normalizeUsername = (value) => typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

// POST /api/auth/register
router.post("/register", async(req, res) => {
    try {
        const rawUsername = normalizeUsername(req.body.username);
        const email = normalizeEmail(req.body.email);
        const password = typeof req.body.password === "string" ? req.body.password.trim() : "";
        const walletAddress = req.body.walletAddress || null;

        if (!rawUsername || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }

        if (rawUsername.length < 3 || rawUsername.length > 30) {
            return res.status(400).json({ error: "Username must be between 3 and 30 characters." });
        }

        if (!/[a-zA-Z]/.test(rawUsername)) {
            return res.status(400).json({ error: "Username must contain at least one letter." });
        }

        if (!email.toLowerCase().endsWith("@gmail.com")) {
            return res.status(400).json({ error: "Email must be a valid Gmail address (e.g. yourname@gmail.com)." });
        }

        const localPart = email.split("@")[0];
        if (!/[a-zA-Z]/.test(localPart)) {
            return res.status(400).json({ error: "Email local part must contain letters, not only numbers." });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            id: Date.now().toString(),
            username: rawUsername,
            email,
            passwordHash: hashedPassword,
            walletAddress: walletAddress || null,
            role: "buyer",
            isSellerVerified: false,
            createdAt: new Date(),
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser.id, username: rawUsername, email },
            getJwtSecret(), { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful!",
            token,
            user: { id: newUser.id, username: rawUsername, email, walletAddress: newUser.walletAddress },
        });
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// POST /api/auth/login
router.post("/login", async(req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = typeof req.body.password === "string" ? req.body.password.trim() : "";

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        if (!email.toLowerCase().endsWith("@gmail.com")) {
            return res.status(400).json({ error: "Email must be a valid Gmail address (e.g. yourname@gmail.com)." });
        }

        const localPart = email.split("@")[0];
        if (!/[a-zA-Z]/.test(localPart)) {
            return res.status(400).json({ error: "Email local part must contain letters, not only numbers." });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid credentials." });

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return res.status(401).json({ error: "Invalid credentials." });

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email },
            getJwtSecret(), { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: { id: user.id, username: user.username, email: user.email, walletAddress: user.walletAddress },
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Server error during login." });
    }
});

module.exports = router;