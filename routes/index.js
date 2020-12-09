var express = require("express");
var router = express.Router();
var A_Database = require("../models/applicant");
var Q_Database = require("../models/question");
var userService = require("../services/userService");
var userFunctions = require("../services/userFunctions");
var passport = require("passport");
const auth = require("../middleware/authentication");
const request = require("request-promise");

/* GET index page */
router.get("/", (req, res) => {
  res.render("index", { message: req.flash("message") || "" });
});

/* POST user login */
router.post(
  "/login",
  passport.authenticate("login", {
    successRedirect: "/instructions",
    failureRedirect: "/",
    failureFlash: true,
  })
);

/* GET mobile register */
router.get("/register", (req, res) => {
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

//Register without recaptcha

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
router.get("/thanks", (req, res, next) => {
  req.logout();
  res.render("thanks");
});

/* GET instructions */
router.get("/instructions", auth.isAttempt, async (req, res, next) => {
  // req.logout();
  // return res.render("closed")
  res.render("instructions");
});

/* GET domain page */
router.get(
  "/domain",
  auth.isAuthenticated,
  auth.isDomainSelected,
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
  auth.isDomainSelected,
  async (req, res, next) => {
    try {
      // req.logout();
      // return res.render("closed")
      var domain = req.body.domain;
      var compete = false;
      var domains = Object.create(null);
      for (var i = 0; i < domain.length; i++) {
        if (domain[i] === "competitive") {
          compete = true;
          domain[i] = domain[domain.length - 1];
          domain.pop();
        }
        if (i < domain.length) {
          domains[domain[i]] = Object.create(null);
          domains[domain[i]].status = 0;
        }
      }
      await A_Database.findByIdAndUpdate(req.user._id, {
        compete: compete,
        domainSelected: true,
        domains: domains,
      });
      // either this or buffer page
      res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

// The main quiz page
router.get("/quiz", auth.isAuthenticated, async (req, res, next) => {});

router.get(
  "/question/:domain",
  auth.isAuthenticated,
  async (req, res, next) => {
    try {
      var domain = req.params.domain;
      var domains = req.user.domains;
      if (domains.hasOwnProperty(domain)) {
        if (domains[domain].status === 0) {
          // set questions and send json response and also updates
          // domainStatus of user to 1
          let questions = await userService.setQuestions(user.id, domain);
          res.json(questions);
        } else {
          return res.json({
            success: false,
            message: "You already attempted this section",
          });
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

router.post(
  "/question/:domain",
  auth.isAuthenticated,
  async (req, res, next) => {
    try {
      var domain = req.params.domain;
      var domains = req.user.domains;
      var responseId = req.body.responseId;
      if (domains.hasOwnProperty(domain)) {
        if (
          domains[domain].status === 1 &&
          domains[domain].response == responseId
        ) {
          let response = R_Database.findById(responseId);
          let solutions = req.body.solutions;
          response.data.forEach((question) => {
            solutions.forEach((solution) => {
              if (question.qid === solution.qid) {
                question.solution = solution.solution;
              }
            });
          });
          response.save();
          return res.json({ success: true });
        } else {
          return res.json({ success: false, message: "Invalid Request" });
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

module.exports = router;
