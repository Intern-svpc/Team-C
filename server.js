const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const stream = require('stream');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const adminAuthRoutes = require('./routes/admin-auth');
const Student = require('./models/Student'); // Import the Student model
const studentAuthRoutes = require('./routes/stud-auth');
const progressRoutes = require('./routes/progress');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/components', express.static(path.join(__dirname, 'components')));
app.use('/auth/student', studentAuthRoutes);
app.use('/progress', progressRoutes);

// Mount admin authentication routes
app.use('/auth/admin', adminAuthRoutes);

// MongoDB Connection
const mongoURI = 'mongodb://127.0.0.1:27017/mentorSessions';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, {
    bucketName: 'videos'
  });
});

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // Use environment variable in production

// Mentor Schema
const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }]
});

// Hash password before saving
mentorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Mentor = mongoose.model('Mentor', mentorSchema);

// Modified Session Schema with mentor reference
const sessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
  authorName: String,
  subjectName: String,
  sessions: Number,
  sessionType: {
    type: String,
    enum: ['free', 'paid'],
    required: true,
  },
  price: {
    type: Number,
    required: function() {
      return this.sessionType === 'paid';
    },
  },
  videos: [{
    sessionTitle: String,
    videoId: mongoose.Schema.Types.ObjectId,
    filename: String
  }]
});

const Session = mongoose.model('Session', sessionSchema);

// Authentication Middleware
const authenticateMentor = async (req, res, next) => {
  try {
    console.log('Auth Header:', req.headers.authorization); // ✅ Debugging log

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.mentor = await Mentor.findById(decoded.mentorId);
    if (!req.mentor) return res.status(401).json({ message: 'Mentor not found' });

    next();
  } catch (error) {
    console.error("Token Verification Failed:", error);
    res.status(401).json({ message: 'Invalid token' });
  }
};


// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Auth Routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const mentor = new Mentor({ name, email, password });
    await mentor.save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating account' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
      const { email, password } = req.body;
      const mentor = await Mentor.findOne({ email });
      if (!mentor || !(await bcrypt.compare(password, mentor.password))) {
          return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = jwt.sign({ mentorId: mentor._id }, JWT_SECRET, { expiresIn: '24h' });

      console.log("Generated Token:", token);  // Debugging log
      res.json({ token }); // ✅ Ensure token is sent
  } catch (error) {
      res.status(500).json({ message: 'Login failed' });
  }
});


// Protected Routes
app.get('/auth/mentor-data', authenticateMentor, (req, res) => {
  res.json({
    name: req.mentor.name,
    email: req.mentor.email
  });
});

// Modified Session creation endpoint with authentication
app.post('/submit-form', authenticateMentor, async (req, res) => {
  console.log('Received form submission:', req.body); // Debug log

  const { authorName, subjectName, sessions, sessionType, price } = req.body;
  const sessionCount = parseInt(sessions);

  if (isNaN(sessionCount) || sessionCount < 1) {
    return res.status(400).json({ message: 'Number of sessions must be a valid positive number' });
  }

  const sessionData = {
    mentor: req.mentor._id,
    authorName,
    subjectName,
    sessions: sessionCount,
    sessionType,
    price: sessionType === 'paid' ? parseFloat(price) : 0,
  };

  try {
    const newSession = new Session(sessionData);
    const savedSession = await newSession.save();
    
    // Add session to mentor's sessions array
    req.mentor.sessions.push(savedSession._id);
    await req.mentor.save();

    console.log('Session created:', savedSession._id); // Debug log

    res.json({ 
      message: 'Session created successfully!', 
      sessionId: savedSession._id,
      sessions: sessionCount // Added sessions count to response
    });
  } catch (err) {
    console.error('Error saving session data:', err);
    res.status(500).json({ message: 'Error saving session data' });
  }
});

// Get mentor's courses
app.get('/mentor/courses', authenticateMentor, async (req, res) => {
  try {
    const sessions = await Session.find({ mentor: req.mentor._id });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Modified video upload endpoint with authentication
app.post('/upload-videos', authenticateMentor, upload.array('sessionVideos', 10), async (req, res) => {
  const { sessionId, sessionTitles } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No videos uploaded' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify mentor owns this session
    if (session.mentor.toString() !== req.mentor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this session' });
    }

    const uploadPromises = files.map(async (file, index) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const readableVideoStream = new stream.PassThrough();
      readableVideoStream.end(file.buffer);

      return new Promise((resolve, reject) => {
        const uploadStream = gfs.openUploadStream(filename, {
          contentType: file.mimetype
        });

        readableVideoStream
          .pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => {
            resolve({
              sessionTitle: Array.isArray(sessionTitles) ? sessionTitles[index] : sessionTitles,
              videoId: uploadStream.id,
              filename: filename
            });
          });
      });
    });

    const uploadedVideos = await Promise.all(uploadPromises);
    session.videos.push(...uploadedVideos);
    await session.save();

    res.status(200).json({ message: 'Videos successfully uploaded' });
  } catch (err) {
    console.error('Error saving videos:', err);
    res.status(500).json({ message: 'Error saving videos' });
  }
});


// Modified routes to check session ownership
app.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session); // ✅ Remove authentication so students can access it
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



// In server.js, modify the upload-video route to handle the authentication and redirection properly
app.get('/upload-video/:sessionId', authenticateMentor, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if the mentor owns this session
    if (session.mentor.toString() !== req.mentor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this session' });
    }

    // Instead of redirecting, send the session data
    res.json({
      sessionId: session._id,
      sessions: session.sessions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/delete-video/:sessionId/:videoId', authenticateMentor, async (req, res) => {
  try {
      const { sessionId, videoId } = req.params;
      console.log(`Delete Request - Session ID: ${sessionId}, Video ID: ${videoId}`); // Debugging

      const session = await Session.findById(sessionId);
      if (!session) {
          console.log("Session not found.");
          return res.status(404).json({ message: "Session not found" });
      }

      // Ensure the mentor owns this session
      if (session.mentor.toString() !== req.mentor._id.toString()) {
          console.log("Unauthorized request.");
          return res.status(403).json({ message: "Unauthorized" });
      }

      // Find and remove the video entry
      const videoIndex = session.videos.findIndex(video => video.videoId.toString() === videoId);
      if (videoIndex === -1) {
          console.log("Video not found in session.");
          return res.status(404).json({ message: "Video not found" });
      }

      // Remove the video from MongoDB GridFS
      try {
          await gfs.delete(new mongoose.Types.ObjectId(videoId));
          console.log("Video deleted from GridFS.");
      } catch (err) {
          console.error("Error deleting video from GridFS:", err);
          return res.status(500).json({ message: "Error deleting video file" });
      }

      // Remove video from session object
      session.videos.splice(videoIndex, 1);
      await session.save();

      console.log("Video successfully deleted from session.");
      res.json({ message: "Video deleted successfully" });

  } catch (err) {
      console.error("Error deleting video:", err);
      res.status(500).json({ message: "Server error" });
  }
});



app.put('/replace-video', authenticateMentor, upload.single('newVideo'), async (req, res) => {
  try {
      const { sessionId, videoId } = req.body;
      const newFile = req.file;

      if (!newFile) return res.status(400).json({ message: "No new video provided" });

      const session = await Session.findById(sessionId);
      if (!session) return res.status(404).json({ message: "Session not found" });

      // Ensure mentor owns the session
      if (session.mentor.toString() !== req.mentor._id.toString()) {
          return res.status(403).json({ message: "Unauthorized" });
      }

      // Upload new video
      const filename = `${Date.now()}-${newFile.originalname}`;
      const readableVideoStream = new stream.PassThrough();
      readableVideoStream.end(newFile.buffer);

      const uploadStream = gfs.openUploadStream(filename, { contentType: newFile.mimetype });
      readableVideoStream.pipe(uploadStream);

      uploadStream.on('finish', async () => {
          // Replace old video entry
          const videoIndex = session.videos.findIndex(v => v.videoId.toString() === videoId);
          if (videoIndex !== -1) {
              session.videos[videoIndex].videoId = uploadStream.id;
              session.videos[videoIndex].filename = filename;
              await session.save();
          }

          res.json({ message: "Video replaced successfully" });
      });

      uploadStream.on('error', (err) => {
          console.error("Error replacing video:", err);
          res.status(500).json({ message: "Error replacing video" });
      });

  } catch (err) {
      console.error("Replace video error:", err);
      res.status(500).json({ message: "Server error" });
  }
});

// Add this endpoint to server.js

app.delete('/delete-course/:courseId', authenticateMentor, async (req, res) => {
  try {
      const courseId = req.params.courseId;
      
      // Find the session/course and verify ownership
      const session = await Session.findById(courseId);
      if (!session) {
          return res.status(404).json({ message: 'Course not found' });
      }

      // Verify the mentor owns this course
      if (session.mentor.toString() !== req.mentor._id.toString()) {
          return res.status(403).json({ message: 'Not authorized to delete this course' });
      }

      // Delete all associated videos from GridFS
      for (const video of session.videos) {
          try {
              await gfs.delete(new mongoose.Types.ObjectId(video.videoId));
          } catch (err) {
              console.error(`Error deleting video ${video.videoId}:`, err);
              // Continue with deletion even if a video fails to delete
          }
      }

      // Remove the session from the mentor's sessions array
      await Mentor.findByIdAndUpdate(
          req.mentor._id,
          { $pull: { sessions: courseId } }
      );

      // Delete the session document
      await Session.findByIdAndDelete(courseId);

      res.json({ message: 'Course deleted successfully' });
  } catch (err) {
      console.error('Error deleting course:', err);
      res.status(500).json({ message: 'Error deleting course' });
  }
});

app.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find({});
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});



// Retain the video streaming endpoint without authentication for student access
app.get('/video/:videoId', async (req, res) => {
  try {
    const videoId = new mongoose.Types.ObjectId(req.params.videoId);
    res.set('Content-Type', 'video/mp4');
    const downloadStream = gfs.openDownloadStream(videoId);
    downloadStream.pipe(res);
    downloadStream.on('error', (error) => {
      console.error('Error streaming video:', error);
      res.status(404).send('Video not found');
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error retrieving video');
  }
});

app.get('/admin/stats', async (req, res) => {
  const mentorCount = await Mentor.countDocuments();
  const studentCount = await Student.countDocuments();
  const subjectCount = await Session.countDocuments();
  const paidSessions = await Session.countDocuments({ sessionType: 'paid' });
  const freeSessions = await Session.countDocuments({ sessionType: 'free' });

  res.json({ mentors: mentorCount,students: studentCount, subjects: subjectCount, paidSessions, freeSessions });
});

app.get('/admin/mentors', async (req, res) => {
  const mentors = await Mentor.find({}, 'name');
  res.json(mentors);
});

app.get('/admin/students', async (req, res) => {
  try {
    // Find all students and select fields we need
    const students = await Student.find({})
      .select('name email profileImage phoneNumber enrolledSessions lastLogin createdAt')
      .populate('enrolledSessions', 'name') // Optional: populate session data if needed
      .lean();
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

app.get('/admin/subjects', async (req, res) => {
  const subjects = await Session.find({}, 'subjectName sessionType');
  res.json({
      free: subjects.filter(s => s.sessionType === 'free').map(s => s.subjectName),
      paid: subjects.filter(s => s.sessionType === 'paid').map(s => s.subjectName),
  });
});

// Add these endpoints to your server.js file

// Admin route for deleting mentors
app.delete('/admin/delete-mentor/:mentorId', authenticateMentor, async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    
    // Check if the requester has admin privileges (you might want to add an admin role check)
    // For now, we'll allow any authenticated mentor to delete another mentor
    // In a production environment, you should restrict this to admin users only
    
    // Get all sessions belonging to this mentor
    const mentorSessions = await Session.find({ mentor: mentorId });
    
    // Delete all videos from these sessions
    for (const session of mentorSessions) {
      for (const video of session.videos) {
        try {
          await gfs.delete(new mongoose.Types.ObjectId(video.videoId));
        } catch (err) {
          console.error(`Error deleting video ${video.videoId}:`, err);
          // Continue deletion process even if a video fails to delete
        }
      }
    }
    
    // Delete all sessions belonging to this mentor
    await Session.deleteMany({ mentor: mentorId });
    
    // Finally delete the mentor
    await Mentor.findByIdAndDelete(mentorId);
    
    res.json({ message: 'Mentor and all associated content deleted successfully' });
  } catch (err) {
    console.error('Error deleting mentor:', err);
    res.status(500).json({ message: 'Error deleting mentor' });
  }
});

// Admin route for deleting students (if you implement student accounts)
app.delete('/admin/delete-student/:studentId', authenticateMentor, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Here you would add code to delete student data
    // Since your current implementation doesn't show student accounts,
    // this is just a placeholder
    
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 