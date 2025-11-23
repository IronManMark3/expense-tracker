// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

function createAccessToken(payload, secret = process.env.ACCESS_TOKEN_SECRET, expiresIn = '15m') {
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn });
}

function createRefreshToken(payload, secret = process.env.REFRESH_TOKEN_SECRET, expiresIn = '7d') {
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyToken
};
