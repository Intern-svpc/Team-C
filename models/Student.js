const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import bcrypt

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  enrolledSessions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
  ],
  progress: {
    type: Map,
    of: {
      enrolledDate: {
        type: Date,
        default: Date.now,
      },
      lastAccessed: {
        type: Date,
        default: Date.now,
      },
      completedVideos: [Number],
      progress: {
        type: Number,
        default: 0,
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;