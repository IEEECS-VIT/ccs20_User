var express = require("express");
var router = express.Router();
var A_Database = require("../models/applicant");
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
    failureFlash: true
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
    console.log(message)
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
router.get(
  "/instructions",
  auth.isAttempt,
  async (req, res, next) => {
    // req.logout();
    // return res.render("closed")
    res.render("instructions", { user: req.user });
  }
);

/* GET domain page */
router.get("/domain", auth.isAttempt, async (req, res, next) => {
  try {
    // req.logout();
    // return res.render("closed")
    return res.render("domains", { user: req.user })
  } catch (error) {
    return next(error)
  }
})

/* POST domain details */
router.post("/domain", auth.isAttempt, async (req, res, next) => {
  try {
    // req.logout();
    // return res.render("closed")
    var startTime = Date.now();
    var domain = req.body.domain;
    var compete = false;
    for (var i = 0; i < domain.length; i++) {
      if (domain[i] === "competitive") {
        compete = true;
        domain[i] = domain[domain.length - 1];
        domain.pop();
        break;
      }
    }
    var maxTime = domain.length * 600;
    await A_Database.findByIdAndUpdate(req.user.id, {
      compete: compete,
      domain: domain,
      startTime: startTime,
      maxTime: maxTime
    });
    res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

/* GET questions */
router.get("/question", auth.isAttempt, async (req, res, next) => {
  try {
    // req.logout();
    // return res.render("closed")
    var stuff = await userService.setQuestions(req.user.id);
    let questions = stuff.map(question => {
      return {
        questionId: question._id,
        userSolution: []
      };
    });
    await A_Database.findByIdAndUpdate(req.user.id, {
      response: questions,
      attempted: true
    });
    const data = await A_Database.findById(req.user.id, "response domain maxTime").populate("response.questionId", "question qDomain qType options").lean();
    res.render("quiz", { data: data });
  } catch (error) {
    return next(error);
  }
});

/* POST answers */
router.post("/question", auth.isSubmit, async (req, res, next) => {
  try {
    // req.logout();
    // return res.render("closed")
    const solutions = req.body.solutions;
    console.log(solutions);
    var endTime = Date.now();
    let user = await A_Database.findById(req.user.id);
    console.log(user);
    let responseToUpdate = user.response;
    responseToUpdate.forEach(question => {
      solutions.forEach(solution => {
        if (solution.questionId == question.questionId) {
          question.userSolution = solution.userSolution;
        }
      });
    });
    user.response = responseToUpdate;
    user.submitted = true;
    user.endTime = endTime;
    await user.save();
    await userService.timeStatus(req.user.id);
    res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
