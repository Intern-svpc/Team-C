const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, accessLevel } = req.body;
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ name, email, password: hashedPassword, accessLevel });
        await newAdmin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Define a single secret

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: admin._id,
            isAdmin: true,
            accessLevel: admin.accessLevel,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // Use JWT_SECRET
        res.json({ token, admin: payload });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Check admin status
router.get('/check', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, JWT_SECRET); // Use JWT_SECRET
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin || !admin.isAdmin) {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }

        res.json({ admin });
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});



module.exports = router;