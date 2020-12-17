var express = require("express");
var router = express.Router();
var A_Database = require("../models/applicant");
var R_Database = require("../models/response");
var userService = require("../services/userService");
var userFunctions = require("../services/userFunctions");
var passport = require("passport");
const auth = require("../middleware/authentication");
const request = require("request-promise");


/* GET index page */
router.get("/", auth.isUser, (req, res) => {
  res.render("index", { message: req.flash("message") || "" });
});

/* POST user login */
router.post(
  "/login",
  auth.isUser,
  passport.authenticate("login", {
    successRedirect: "/instructions",
    failureRedirect: "/",
    failureFlash: true,
  })
);

/* GET mobile register */
router.get("/register", auth.isUser, (req, res) => {
  // req.logout();
  // return res.render("closed")
  res.render("register", { message: "" });
});

//Register with recaptcha

// /* POST register details with captcha */
// router.post("/register", async (req, res, next) => {
//   // req.logout();
//   // return res.render("closed")
//   console.log(req.body)
//   const options = {
//     method: "POST",
//     uri: "https://www.google.com/recaptcha/api/siteverify",
//     formData: {
//       secret: process.env.RECAPTCHA_SECRET,
//       response: req.body["g-recaptcha-response"]
//     }
//   };
//   request(options)
//     .then(response => {
//       let cResponse = JSON.parse(response);
//       if (!cResponse.success) {
//         return res.render("register", { message: "Invalid Captcha" });
//       }
//       return userFunctions
//         .addUser(req.body)
//         .then(function (message) {
//           if (message === "ok") return res.render("index", { message: "ok" });
//           return res.render("index", { message: message });
//         })
//         .catch(err => {
//           console.log(err);
//           next(err);
//         });
//     })
//     .catch(err => next(err));
// });

// Register without recaptcha

/* POST register details */
router.post("/register", async (req, res, next) => {
  try {
    let message = await userFunctions.addUser(req.body);
    // console.log(req.body);
    console.log(message);
    if (message === "ok") return res.render("index", { message: "ok" });
    return res.render("index", { message: message });
  } catch (err) {
    next(err);
  }
});

/* GET user logout */
router.get("/logout", auth.isLoggedIn, (req, res) => {
  req.logout();
  res.redirect("/");
});

/* GET thanks page */
router.get("/thanks", auth.isAuthenticated, (req, res, next) => {
  res.render("thanks");
});

/* GET instructions */
router.get("/instructions", auth.check, async (req, res, next) => {
  res.render("instructions");
});

/* GET domain page */
router.get(
  "/domain",
  auth.isAuthenticated,
  auth.isSelected,
  async (req, res, next) => {
    try {
      // req.logout();
      // return res.render("closed")
      return res.render("domains", { user: req.user });
    } catch (error) {
      return next(error);
    }
  }
);

/* POST domain details */
router.post(
  "/domain",
  auth.isAuthenticated,
  auth.isSelected,
  async (req, res, next) => {
    try {
      // req.logout();
      // return res.render("closed")
      var domain = req.body.domain;
      var compete = false;
      var domainsLeft = [];
      for (var i = 0; i < domain.length; i++) {
        if (domain[i] === "competitive") {
          compete = true;
          domain[i] = domain[domain.length - 1];
          domain.pop();
        }
        if (i < domain.length) {
          domainsLeft.push(domain[i]);
        }
      }
      await A_Database.findByIdAndUpdate(req.user._id, {
        compete: compete,
        domainsLeft: domainsLeft,
      });
      await userService.setQuestions(req.user._id, domain);
      // either this or buffer page
      res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

/* The main quiz page */
router.get(
  "/quiz",
  auth.isAuthenticated,
  auth.isQuiz,
  async (req, res, next) => {
    res.render("quiz2", { user: req.user.regno });
  }
);

/* Get User's Domain Info */
router.get("/domaininfo", auth.isAuthenticated, (req,res,next)=>{
  if (!req.xhr) {
    return res.json({success: false, message: "Unauthorized to access"});
  }
  else {
    var domains = ["technical", "management", "design", "documentation"];
    var response = [];
    domains.forEach((domain)=>{
      if (req.user.domains.hasOwnProperty(domain)){
        response.push(!req.user.domainsLeft.includes(domain));
      } else {
        response.push(null);
      }
    });
    res.json({success:true, data: response});
  }
});

/* Route to get question for each part */
router.get(
  "/question/:domain",
  auth.isAuthenticated,
  async (req, res, next) => {
    try {
      if (!req.xhr) {
        return res.json({success: false, message: "Unauthorized to access"});
      }
      var domain = req.params.domain;
      var domains = req.user.domains;
      if (domains.hasOwnProperty(domain)) {
        // Always returns the questions response object for each domain
        // populate according to response object
        try {
          if (!req.user.domainsLeft.includes(domain)) {
            return res.json({
              success: false,
              message: "Already submitted for this domain",
            });
          }
          let questions = await R_Database.findById(domains[domain], "data")
            .populate("data.questionId", "question option qType options")
            .lean();
          var length = questions.data.length;
          while (length > 0) {
            --length;
            questions.data[length] = questions.data[length].questionId;
          }
          res.json({success:true, data: questions.data});
        } catch (err) {
          console.log(err.message);
          return res.json({ success: false, message: err.message });
        }
      } else {
        return res.json({
          success: false,
          message: "No such domain selected!",
        });
      }
    } catch (error) {
      return next(error);
    }
  }
);

/* Route for posting each part answer */
router.post(
  "/question/:domain",
  auth.isAuthenticated,
  async (req, res, next) => {
    try {
      if (!req.xhr) {
        return res.json({success: false, message: "Unauthorized to access"});
      }
      var domain = req.params.domain;
      var domains = req.user.domains;
      if (domains.hasOwnProperty(domain)) {
        if (!req.user.domainsLeft.includes(domain)) {
          return res.json({
            success: false,
            message: "Already submitted for this domain",
          });
        }
        let responseObj = await R_Database.findById(domains[domain]);
        responseObj.data.forEach((que) => {
          req.body.solutions.forEach((sol) => {
            if (sol.questionId == que.questionId) {
              que.solution = sol.solution;
            }
          });
        });
        responseObj.startTime = req.body.startTime;
        responseObj.endTime = req.body.endTime;
        await responseObj.save();
        var domainsLeft = req.user.domainsLeft;
        if (domainsLeft.indexOf(domain) >= 0) {
          domainsLeft.splice(domainsLeft.indexOf(domain), 1);
        }
        await A_Database.findByIdAndUpdate(req.user._id, {
          domainsLeft: domainsLeft,
        });
        res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "No such domain selected!",
        });
      }
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
