const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

function extractProfile(profile) {
  let imageUrl = "";
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  } 
  // console.log(profile);
  return {
    id: profile.id,
    email: profile.emails[0].value,
    displayName: profile.displayName,
    image: imageUrl,
  };
}
passport.use(new GoogleStrategy({
  clientID: process.env.OAUTH_CLIENT,
  clientSecret: process.env.OAUTH_SECRET,
  callbackURL: process.env.OAUTH_REDIRECT,
  accessType: "offline",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
  (accessToken, refreshToken, profile, cb) => {
    cb(null, extractProfile(profile));
  }));

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});