const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String },
  name: { type: String },
  roles: { type: [String], default: ['user'] },
  otp: {
    code: String,
    expiresAt: Date
  },
  refreshTokens: [{ token: String, createdAt: Date }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
