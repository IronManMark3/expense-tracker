// backend/src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const setupPassport = require('./config/passportGoogle');
const { connect } = require('./config/db');
const metaRoutes = require('./routes/meta');
const budgetRoutes = require('./routes/budgets'); // NEW
const goalRoutes = require('./routes/goals');
const quickActionRoutes = require('./routes/quickActions');

const app = express();

// If behind a proxy (Render, Vercel), trust it so secure cookies and req.ip work correctly
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Basic middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
// parse urlencoded bodies (needed by some OAuth callbacks/forms)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// CORS - allow only your frontend origin(s). Provide sensible dev defaults.
const allowedOrigins = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');

app.use(cors({
  origin: function(origin, cb) {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
    return cb(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
}));

// Global rate limiting (consider stricter limits for auth routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try later' },
});
app.use(limiter);

// Passport (Google OAuth) setup
setupPassport();
app.use(passport.initialize());

// Simple health check (useful for Render health checks)
app.get('/_health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Routes
app.use('/api/meta', metaRoutes);
const oauthRoutes = require('./routes/oauth');      // /api/auth/google...
const authRoutes = require('./routes/auth');        // /api/auth/...
const expenseRoutes = require('./routes/expenses'); // /api/expenses/...

app.use('/api/auth', oauthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes); // NEW
app.use('/api/goals', goalRoutes);     // NEW
app.use('/api/quick-actions', quickActionRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  // don't leak internal details in production
  const msg = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
  res.status(500).json({ message: msg });
});

// Start server after DB connect
const PORT = process.env.PORT || 4000;
connect(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}).catch(err => {
  console.error('DB connect failed', err);
  process.exit(1);
});

// catch unhandled rejections / exceptions (graceful shutdown could be added)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown', err);
  process.exit(1); // consider a graceful shutdown
});
