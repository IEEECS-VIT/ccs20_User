var express = require("express");
var router = express.Router();
var A_Database = require("../models/applicant");
var R_Database = require("../models/response");
var userService = require("../services/userService");
var userFunctions = require("../services/userFunctions");
var percentileFunctions = require("../services/percentileFunctions");
var passport = require("passport");
const auth = require("../middleware/authentication");
const request = require("request-promise");
const Feedback=require("../models/feedback");
require("../middleware/oauth.js");

/* GET index page */
router.get("/", (req, res) => {
    console.log(req.query['error'])
    res.render("index.ejs", {
        message: req.query['error']
    });
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
    // return res.render("closed");
    res.render("register", {
        message: ""
    });
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

/** GET /register new version */


router.get("/feedback", auth.isAuthenticated, auth.isFeedback, (req, res) => {
   res.render("feedback", { message: "" });
});

router.post('/feedback', auth.isAuthenticated,
auth.isCompleted, async(req, res) => {

  const feedback = new Feedback({
          Name: req.user._id,
          Question1:req.body.q1,
          Question2:req.body.q2,
          Question3:req.body.q3,
          Question4:req.body.q4,
          Question5:req.body.q5,
          Message:req.body.text
  })
  console.log(req.body)
  const fb = await feedback.save(
          async function(err){ 
              if(err)
                  { 
                    console.log(err); 
                    return; 
                  }  
                else{
                    console.log(req.user.email)
                    let newuser = await A_Database.findOneAndUpdate({email: req.user.email},{isFeedback:true})
                }
          }
          );
  
  res.redirect('/thanks');
});
/* GET user logout */
router.get("/logout", auth.isLoggedIn, (req, res) => {
  req.logout();
  res.redirect("/");
});

// GET thanks page 
router.get(
  "/thanks",
  auth.isAuthenticated,
  auth.isCompleted,
  async (req, res, next) => {
    let user = await A_Database.findOne({email: req.user.email}, {});
    let responses = user.domains;
    let data = [];
    async function fetchData(domain) {
      let rObj = await R_Database.findById(responses[domain]).lean();
      // let rObj = await R_Database.findById(responses[domain]).lean();
      let allTimeAttemptedObject = await R_Database.aggregate([
        {
          '$match': {
            'domain': domain
          }
        },
        {
          '$sort': {
            'timeAttempted': -1
          }
        }, {
          '$group': {
            '_id': null, 
            'allTimeAttempted': {
              '$push': '$timeAttempted'
            }
          }
        }, {
          '$project': {
            '_id': 0
          }
        }
      ])
      let timeLeft;
      if (rObj.timeAttempted === undefined || rObj.timeAttempted === null) {
        timeLeft = 0;
      } else {
        timeLeft = (rObj.timeAttempted) / 1000;
      }
      let timePercentile = percentileFunctions.percentRank(rObj.timeAttempted, allTimeAttemptedObject[0].allTimeAttempted)*100;
      let ans = rObj.data.length;
      timeLeft = 60 * 10 - timeLeft;
      timeLeft = Math.round(Math.max(timeLeft, 0));
      rObj.data.forEach((subData) => {
        if (!subData.solution || subData.solution === []) {
          ans -= 1;
        } else if (Array.isArray(subData.solution)) {
          ans -= 1;
          for (let xx = 0; xx < subData.solution.length; xx++){
            if (subData.solution[xx] !== "") {
              ans += 1;
              break;
            }
          }
        }
      });
      return {
        timePercentile: timePercentile,
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
      .then(async () => {
        let user = await A_Database.findOne({email: req.user.email}, {});
        res.render("thanks", { user: user.regno, data: data });
      })
      .catch((error) => {
        next(error);
      });
  }
);
// router.get("/register", auth.isLoggedIn, (req, res) => {
//     // let user_exists = A_Database.exists({email: request.})
//     // return response.sendStatus(200);
//     res.render("register.ejs", {
//         username: req.user.name,
//         message: ""
//     });
// });

router.get("/register", auth.isUser, (req, res) => {
    // req.logout();
    // return res.render("closed");
    res.render("register", {
        message: ""
    });
});

/** POST /register new version */
router.post("/register", auth.isLoggedIn, async (req, res) => {
    // let user_exists = A_Database.exists({email: request})
    console.log(request);
    let details = {
        name: req.body.name,
        regno: req.body.regno,
        email: req.user.email,
        phone: req.body.phone,
        gender: req.body.gender,
        registered: true,
    };


    const filter = { email: req.user.email };
    // const update = details;
    let doc = await A_Database.findOneAndUpdate(filter, details);

    // await A_Database.find(details, (err, data) => {
    //   if (err) {
    //     console.log(err);
    //     res.render("register.ejs", { message: err });
    //   } else {
    //     console.log(data);
    //     res.render("register.ejs", { message: "ok" });
    //     res.redirect("/quiz");
    //   }
    // });

    // A_Database.update()
    console.log(details);
    res.redirect("/quiz");
});


/** 
 * Google OAuth
 */

router.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
        "/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/login?state=failed_login&reason=OAUTH_ERROR",
        }),
        function(req, res) {
            // Successful authentication, redirect home.
            // console.log(req);

            // If user exists, then check if registration complete or not.
            // If not, render the register.ejs form
            // Else, send to quiz page

            // console.log(req);

            // if (req.query.hd === "vitstudent.ac.in") {
            if (true) {
                // Redirect to
                // let user_exists = 
                A_Database.exists({
                        $and: [{
                            email: req.user.email
                        }, {
                            registered: true
                        }],
                    })
                    .then((if_exist) => {
                            // console.log(A_Database.find({$and: [{email: req.user.email}, {registered: true}]}));
                            if (if_exist) {
                                return res.redirect("/quiz");
                            } else {
                                // return res.send("<h1>Redirecting to form...</h1>");

                                let details = {
                                    name: req.user.name,
                                    email: req.user.email,
                                    registered: false,
                                };

                                A_Database.exists({
                                        $and: [{
                                            email: req.user.email
                                        }, {
                                            registered: false
                                        }],
                                    }).then(if_exist => {
                                        if (if_exist) {
                                            res.redirect("/register");
                                        } else {
                                            A_Database.create(details, (error) => {
                                                if (error) {
                                                    console.log("Error1");
                                                } else {
                                                    res.redirect("/register");
                                                }
                                            });
                                        }
                                    }).catch((error) => {
                                        if (error) {
                                            console.log("Error2");
                                        }

                                        // res.redirect("/register");
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    });

                                // await A_Database.exists({
                                //   $and: [{ email: req.user.email }, { registered: false }],
                                // }).then((req, res) => {
                                //   // ejs.renderFile("register.ejs");
                                //   res.send("<h1>Redirecting to form...</h1>");
                                // });

                                // console.log(user_exists);
                      }  });
                            // }); 
                    }
                else {
                    res.redirect('/?error=Please Login Using VIT Email ID')
                }
            }
        );



        /* POST register details */
        // router.post("/register", async (req, res, next) => {
        //   try {
        //     let message = await userFunctions.addUser(req.body);
        //     // console.log(req.body);
        //     console.log("Tried Reg: " +  req.body.regno + " " + message);
        //     if (message === "ok") return res.render("index", { message: "ok" });
        //     return res.render("index", { message: message });
        //   } catch (err) {
        //     next(err);
        //   }
        // });

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
                    return res.render("domains", {
                        user: req.user
                    });
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
                    domain.push("management");
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
                    await A_Database.findOneAndUpdate({email: req.user.email}, {
                        compete: compete,
                        domainsLeft: domainsLeft,
                    });

                    //  console.log("Debug0");
                    await userService.setQuestions({email: req.user.email}, domain);
                    // console.log("debug1");
                    // either this or buffer page
                    res.json({
                        success: true
                    });
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
              let user = await A_Database.findOne({email: req.user.email}, {})
                res.render("quiz2", {
                    user: user.regno
                });
            }
        );

        /* Get User's Domain Info */
        router.get("/domaininfo", auth.isAuthenticated, async (req, res, next) => {
            if (!req.xhr) {
                return res.json({
                    success: false,
                    message: "Unauthorized to access"
                });
            } else {
                var domains = ["technical", "management", "design", "documentation"];
                var response = [];

                let user = await A_Database.findOne({email: req.user.email}, {})
                console.log(user);

                domains.forEach((domain) => {
                    // console.log(domain);
                    if (Object.keys(user.domains).includes(domain)) {
                        // response.push(Object.keys(user.domains).includes(domain));
                        response.push(!user.domainsLeft.includes(domain));
                    } else {
                        response.push(null);
                    }
                });
                res.json({
                    success: true,
                    data: response
                });
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
                    let user = await A_Database.findOne({email: req.user.email}, {});
                    var domain = req.params.domain;
                    var domains = user.domains;

                    if (domains.hasOwnProperty(domain)) {
                        // Always returns the questions response object for each domain
                        // populate according to response object
                        try {
                            if (!user.domainsLeft.includes(domain)) {
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
                            res.json({
                                success: true,
                                data: questions.data
                            });
                        } catch (err) {
                            console.log(user.regno + " domain " + domain + " question get " + error.message);
                            return res.json({
                                success: false,
                                message: err.message,
                                code: "er"
                            });
                        }
                    } else {
                        return res.json({
                            success: false,
                            message: "No such domain selected!",
                            code: "ns",
                        });
                    }
                } catch (error) {
                  let user = await A_Database.findOne({email: req.user.email}, {});
                    console.log(user.regno + " domain " + domain + " question get " + error.message);
                    return res.json({
                        success: false,
                        message: error.message,
                        code: "er"
                    });
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
                    let user = await A_Database.findOne({email: req.user.email}, {});
                    var domain = req.params.domain;
                    var domains = user.domains;
                    if (domains.hasOwnProperty(domain)) {
                        if (!user.domainsLeft.includes(domain)) {
                            return res.json({
                                success: false,
                                message: "Already submitted for this domain",
                                code: "as",
                            });
                        }
                        if (req.body.solutions === undefined) {
                            req.body.solutions = [];
                        }
                        let responseObj = await R_Database.findById(domains[domain]);
                        responseObj.data.forEach((que) => {
                            req.body.solutions.forEach((sol) => {
                                if (sol.questionId == que.questionId) {
                                    if (sol.solution !== undefined) {
                                        que.solution = sol.solution;
                                    }
                                }
                            });
                        });
                        responseObj.startTime = req.body.startTime;
                        responseObj.endTime = req.body.endTime;
                        responseObj.timeAttempted = req.body.endTime - req.body.startTime;
                        responseObj.domain = domain
                        await responseObj.save();
                        // let user = await A_Database.findOne({email: req.user.email}, {})
                        var domainsLeft = user.domainsLeft;
                        if (domainsLeft.indexOf(domain) >= 0) {
                            domainsLeft.splice(domainsLeft.indexOf(domain), 1);
                        }
                        await A_Database.findByIdAndUpdate(user._id, {
                            domainsLeft: domainsLeft,
                        });
                        res.json({
                            success: true
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: "No such domain selected!",
                            code: "ns",
                        });
                    }
                } catch (error) {
                  let user = await A_Database.findOne({email: req.user.email}, {});
                    console.log(user.regno + " domain " + domain + " question post " + error.message);
                    return res.json({
                        success: false,
                        message: error.message,
                        code: "er"
                    });
                }
            }
        );

        module.exports = router;