const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function setupPassport() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK_URL,
    passReqToCallback: false,
  },
  // profile => create/find user
  async function(accessToken, refreshToken, profile, done) {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email in Google profile'));

      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          name: profile.displayName,
          // no passwordHash; mark as oauth user
          roles: ['user']
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
};
