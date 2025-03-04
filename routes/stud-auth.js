const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const verifyToken = require('../middlewares/middleware'); // Import verifyToken


// Signup Route
router.post('/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      console.log('Received signup request:', { name, email, password }); // Log the request payload
  
      // Validate input
      if (!name || !email || !password) {
        console.error('Validation failed: Name, email, and password are required');
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }
  
      // Check if email already exists
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        console.error('Email already registered:', email);
        return res.status(409).json({ error: 'Email already registered' });
      }
  
      // Create new student
const newStudent = new Student({
  name,
  email,
  password, // Use the plain password - it will be hashed by the pre-save middleware
});
  
      // Save student to database
      await newStudent.save();
      console.log('Student created successfully:', newStudent); // Log the created student
  
      // Generate JWT token
      const token = jwt.sign(
        { id: newStudent._id, email: newStudent.email, name: newStudent.name },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '7d' }
      );
  
      // Return success with token and user info (excluding password)
      const { password: _, ...studentInfo } = newStudent.toObject();
      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: studentInfo,
      });
    } catch (error) {
      console.error('Signup error:', error); // Log the error
      res.status(500).json({ error: 'Server error during registration' });
    }
  });

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email, name: student.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return success with token and user info (excluding password)
    const { password: _, ...studentInfo } = student.toObject();
    res.json({
      message: 'Login successful',
      token,
      user: studentInfo,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current student profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
      const student = await Student.findById(req.user.id);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
  
      // Return student info (excluding password)
      const { password, ...studentInfo } = student.toObject();
      res.json(studentInfo);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Server error fetching profile' });
    }
  });
  
  // Update student profile
  router.put('/profile', verifyToken, async (req, res) => {
    try {
      const { name, profileImage, phoneNumber } = req.body;
      const updateData = {};
  
      if (name) updateData.name = name;
      if (profileImage) updateData.profileImage = profileImage;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
  
      await Student.findByIdAndUpdate(req.user.id, { $set: updateData });
  
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Server error updating profile' });
    }
  });

module.exports = router;