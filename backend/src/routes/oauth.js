const express = require('express');
const passport = require('passport');
const router = express.Router();
const { createAccessToken, createRefreshToken } = require('../utils/jwt');

// kickoff Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }), async (req, res) => {
  // user is in req.user
  const user = req.user;
  const payload = { id: user._id, email: user.email, roles: user.roles };

  const accessToken = createAccessToken(payload, process.env.ACCESS_TOKEN_SECRET, '15m');
  const refreshToken = createRefreshToken(payload, process.env.REFRESH_TOKEN_SECRET, '7d');

  // store refresh token server-side (same pattern as local auth)
  user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
  await user.save();

  // Redirect back to frontend with tokens in query (MVP)
  // WARNING: tokens in query are visible in browser history and referer; see notes below.
  const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
  redirectUrl.pathname = '/oauth-callback';
  redirectUrl.searchParams.set('accessToken', accessToken);
  redirectUrl.searchParams.set('refreshToken', refreshToken);

  return res.redirect(redirectUrl.toString());
});

router.get('/google/failure', (req, res) => {
  return res.redirect(process.env.FRONTEND_URL + '/login?error=oauth_failed');
});

module.exports = router;
