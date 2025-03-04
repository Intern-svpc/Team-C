// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const router = express.Router();

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware to verify JWT token
const authenticateMentor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.mentor = await Mentor.findById(decoded.mentorId);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if mentor already exists
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new mentor
    const mentor = new Mentor({ name, email, password });
    await mentor.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating account' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find mentor and validate password
    const mentor = await Mentor.findOne({ email });
    if (!mentor || !(await mentor.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ mentorId: mentor._id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get mentor data
router.get('/mentor-data', authenticateMentor, async (req, res) => {
  res.json({
    name: req.mentor.name,
    email: req.mentor.email
  });
});

// Get mentor's courses
router.get('/mentor/courses', authenticateMentor, async (req, res) => {
  try {
    const sessions = await Session.find({ _id: { $in: req.mentor.sessions } });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

module.exports = router;