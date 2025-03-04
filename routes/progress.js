const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const verifyToken = require('../middlewares/middleware'); // Import verifyToken

// Enroll in a course
router.post('/enroll/:sessionId', verifyToken, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const studentId = req.user.id;
  
      // Validate session exists
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      // Update student's enrolled sessions
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
  
      // Check if already enrolled
      if (student.enrolledSessions.includes(sessionId)) {
        return res.status(409).json({ error: 'Already enrolled in this course' });
      }
  
      // Add to enrolled sessions and initialize progress
      student.enrolledSessions.push(sessionId);
      student.progress.set(sessionId, {
        enrolledDate: new Date(),
        lastAccessed: new Date(),
        completedVideos: [],
        progress: 0,
      });
  
      await student.save();
  
      res.status(200).json({
        message: 'Successfully enrolled in course',
        courseId: sessionId,
      });
    } catch (error) {
      console.error('Enrollment error:', error);
      res.status(500).json({ error: 'Server error during enrollment' });
    }
  });
  
  // Update video progress
  router.post('/update-progress/:sessionId', verifyToken, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { videoId, videoIndex, completed } = req.body;
      const studentId = req.user.id;
  
      if (videoIndex === undefined) {
        return res.status(400).json({ error: 'Video index is required' });
      }
  
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
  
      // Check if enrolled in this course
      if (!student.enrolledSessions.includes(sessionId)) {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
  
      // Get session to calculate overall progress
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      // Update progress
      const currentProgress = student.progress?.[sessionId] || { completedVideos: [] };
      let completedVideos = [...(currentProgress.completedVideos || [])];
  
      if (completed && !completedVideos.includes(videoIndex)) {
        completedVideos.push(videoIndex);
      } else if (!completed && completedVideos.includes(videoIndex)) {
        completedVideos = completedVideos.filter(i => i !== videoIndex);
      }
  
      // Calculate progress percentage
      const progressPercentage = session.videos
        ? Math.round((completedVideos.length / session.videos.length) * 100)
        : 0;
  
      // Update the database
      await Student.findByIdAndUpdate(studentId, {
        $set: {
          [`progress.${sessionId}`]: {
            completedVideos,
            lastAccessed: new Date(),
            progress: progressPercentage,
          },
        },
      });
  
      res.json({
        message: 'Progress updated successfully',
        progress: progressPercentage,
        completedVideos,
      });
    } catch (error) {
      console.error('Progress update error:', error);
      res.status(500).json({ error: 'Server error updating progress' });
    }
  });

module.exports = router;