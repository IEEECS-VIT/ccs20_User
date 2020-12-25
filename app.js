const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("cookie-session");
const flash = require("connect-flash");
require("dotenv").config();


mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true },
  err => {
    if (!err) console.log("Connection successful");
  }
);

const usersRouter = require("./routes");
const app = express();
app.disable("x-powered-by");

// certbot
// app.use("/.well-known", express.static(path.join(__dirname, "certbot")));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


// // GET CountDown Page
// // For all the routes
// app.use("/", (req,res) => {
//   res.render("countDown"); 
// });

// GET Closed Page
// For all the routes
app.use("/", (req,res) => {
  res.render("closed"); 
});

const expiryDate = new Date(5 * Date.now() + 60 * 60 * 1000); // 5 hours
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: true,
      expires: expiryDate
    },
    keys: process.env.SESSION_KEYS.split()
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes
app.use("/", usersRouter);
require("./config/passport")(passport);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  console.log(err.message)
  return res.render("error", { success: false, message: err.message });
});



module.exports = app;
