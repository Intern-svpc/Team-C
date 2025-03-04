// models/mentor.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

// Method to validate password
mentorSchema.methods.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

const Mentor = mongoose.model('Mentor', mentorSchema);
module.exports = Mentor;