const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("./config/config.js");

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
  clientID: config.clientId,
  clientSecret: config.secret,
  callbackURL: config.callback,
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