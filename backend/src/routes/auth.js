const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../models/User');
const { createAccessToken, createRefreshToken, verifyToken } = require('../utils/jwt');
const { generateOtp, sendOtpEmail } = require('../utils/otpService');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().optional()
});

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).send({ errors: error.details.map(d => d.message) });

  const { email, password, name } = value;
  if (await User.findOne({ email })) return res.status(409).send({ message: 'Email exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = new User({ email, passwordHash, name });
  await user.save();

  res.status(201).json({ message: 'User created' });
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).send({ errors: error.details.map(d => d.message) });

  const { email, password } = value;
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) return res.status(401).send({ message: 'Invalid creds' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).send({ message: 'Invalid creds' });

  const payload = { id: user._id, email: user.email, roles: user.roles };
  const accessToken = createAccessToken(payload, process.env.ACCESS_TOKEN_SECRET, '15m');
  const refreshToken = createRefreshToken(payload, process.env.REFRESH_TOKEN_SECRET, '7d');

  // Save refresh token (simple approach)
  user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
  await user.save();

  // send tokens
  res.json({ accessToken, refreshToken, user: { email: user.email, name: user.name } });
});

// Send OTP for login
router.post('/otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  let user = await User.findOne({ email });
  if (!user) {
    // Optionally allow auto-create on OTP request
    user = new User({ email });
    await user.save();
  }
  const code = generateOtp();
  user.otp = { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
  await user.save();
  await sendOtpEmail(email, code);
  res.json({ message: 'OTP sent' });
});

// Verify OTP
router.post('/otp/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'email and code required' });
  const user = await User.findOne({ email });
  if (!user || !user.otp || !user.otp.code) return res.status(400).json({ message: 'No OTP' });
  if (user.otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
  if (user.otp.code !== code) return res.status(400).json({ message: 'Invalid OTP' });

  user.otp = undefined;
  const payload = { id: user._id, email: user.email, roles: user.roles };
  const accessToken = createAccessToken(payload, process.env.ACCESS_TOKEN_SECRET, '15m');
  const refreshToken = createRefreshToken(payload, process.env.REFRESH_TOKEN_SECRET, '7d');
  user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
  await user.save();

  res.json({ accessToken, refreshToken, user: { email: user.email, name: user.name } });
});

// Refresh token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
  try {
    const payload = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    const exists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!exists) return res.status(401).json({ message: 'Token not recognized' });

    // Optionally rotate refresh token:
    const newAccess = createAccessToken({ id: user._id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, '15m');
    const newRefresh = createRefreshToken({ id: user._id, email: user.email }, process.env.REFRESH_TOKEN_SECRET, '7d');
    // remove old refresh, store new
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({ token: newRefresh, createdAt: new Date() });
    await user.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
