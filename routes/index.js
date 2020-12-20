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
router.get(
  "/thanks",
  auth.isAuthenticated,
  auth.isCompleted,
  async (req, res, next) => {
    let responses = req.user.domains;
    let data = [];
    async function fetchData(domain) {
      let rObj = await R_Database.findById(responses[domain]).lean();
      let timeLeft;
      if (rObj.endTime === undefined || rObj.startTime === undefined) {
        timeLeft = 0;
      } else {
        timeLeft = (rObj.endTime - rObj.startTime) / 1000;
      }
      let ans = rObj.data.length;
      timeLeft = 60 * 10 - timeLeft; // 30 seconds as per backend
      timeLeft = Math.round(Math.max(timeLeft, 0));
      rObj.data.forEach((subData) => {
        if (!subData.solution || subData.solution === []) {
          ans -= 1;
        }
      });
      return {
        timeLeft: timeLeft,
        sectionName: domain.substr(0, 1).toUpperCase() + domain.substr(1),
        qAnswered: ans,
        qUnanswered: rObj.data.length - ans,
      };
    }
    let promises = [];
    Object.keys(responses).forEach((domain) => {
      promises.push(
        fetchData(domain).then((subData) => {
          data.push(subData);
        })
      );
    });
    Promise.all(promises)
      .then(() => {
        res.render("thanks", { data: data });
      })
      .catch((error) => {
        next(error);
      });
  }
);

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
router.get("/domaininfo", auth.isAuthenticated, (req, res, next) => {
  if (!req.xhr) {
    return res.json({ success: false, message: "Unauthorized to access" });
  } else {
    var domains = ["technical", "management", "design", "documentation"];
    var response = [];
    domains.forEach((domain) => {
      if (req.user.domains.hasOwnProperty(domain)) {
        response.push(!req.user.domainsLeft.includes(domain));
      } else {
        response.push(null);
      }
    });
    res.json({ success: true, data: response });
  }
});

/* Route to get question for each part */
router.get(
  "/question/:domain",
  auth.isAuthenticated,
  async (req, res, next) => {
    try {
      if (!req.xhr) {
        return res.json({
          success: false,
          message: "Unauthorized to access",
          code: "ua",
        });
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
              code: "as",
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
          res.json({ success: true, data: questions.data });
        } catch (err) {
          console.log(err.message);
          return res.json({ success: false, message: err.message, code: "er" });
        }
      } else {
        return res.json({
          success: false,
          message: "No such domain selected!",
          code: "ns",
        });
      }
    } catch (error) {
      console.log(req.user.regno + " domain " + domain + " question get " + error.message);
      return res.json({ success: false, message: error.message, code: "er" });
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
        return res.json({
          success: false,
          message: "Unauthorized to access",
          code: "ua",
        });
      }
      var domain = req.params.domain;
      var domains = req.user.domains;
      if (domains.hasOwnProperty(domain)) {
        if (!req.user.domainsLeft.includes(domain)) {
          return res.json({
            success: false,
            message: "Already submitted for this domain",
            code: "as",
          });
        }
        let responseObj = await R_Database.findById(domains[domain]);
        responseObj.data.forEach((que) => {
          req.body.solutions.forEach((sol) => {
            if (sol.questionId === que.questionId) {
              que.solution = [];
              if (Array.isArray(sol.solution) && sol.solution !== undefined) {
                sol.solution.forEach((opt) => {
                  if (opt !== "") {
                    que.solution.push(opt);
                  }
                });
              }
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
          code: "ns",
        });
      }
    } catch (error) {
      console.log(req.user.regno + " domain " + domain + " question post " + error.message);
      return res.json({ success: false, message: error.message, code: "er" });
    }
  }
);

module.exports = router;
