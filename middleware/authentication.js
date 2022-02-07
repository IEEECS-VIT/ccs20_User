const A_Database = require("../models/applicant");

module.exports = {
  // isLoggedIn: (req, res, next) => {
  //   if (req.isAuthenticated()) {
  //     console.log("yes, is authenticated.");
  //     return next();
  //   }
  //   console.log("auth failed");
  //   res.redirect("/");
  // },
  isSelected:(req,res,next) => {
    if (!req.user.questionSelected) return next();
    res.redirect("/quiz");
  },
  isCompleted: (req,res,next) => {
    A_Database.findOne({email: req.user.email}, (error, user) => {
    if(user.domainsLeft.length !== 0){
      return res.redirect("/quiz");
    } 
    next();
  });
  },
  check:(req,res,next)=>{
    if (req.user.questionSelected) {
      if(req.user.domainsLeft.length === 0){
        return res.redirect("/feedback");
      }
      return res.redirect("/quiz");
    } 
    next(); 
  },
  isQuiz:(req,res,next) => {
    A_Database.findOne({email: req.user.email}, (error, user) => {
      if (user.questionSelected) {
        if(user.domainsLeft.length === 0){
          return res.redirect("/feedback");
        }
        return next();
      }
      res.redirect("/domain");
    });
    
  },

  isAuthenticated: (req, res, next) => {
    // console.log(req.user)
    if (req.user && req.user.id ) {// req.user.regno && (req.user.regno.startsWith("21") || req.user.regno.startsWith("20")) || req.user.regno.startsWith("19")){
      return next();
    }
    console.log("Not Authenticated to enter");
    res.redirect("/register");
  },
  isUser: (req,res,next) => {
    if(!req.user || !req.user._id){
      return next();
    }
    res.redirect("/instructions");
  },
  isLoggedIn: (req, res, next) => {
    if (req.user) {
      next();
    } else {
      // res.sendStatus(401);
      
      console.log("auth failed");
      res.redirect("/");
    }
  },
  isFeedback: (req, res, next) => {
    A_Database.findOne({email: req.user.email}, (error, user) => {
      if(error){
        res.redirect('/')
      }
      else{
        if(user.isFeedback){
          res.redirect('/thanks')
        }
        else{
          next();
        }
      }
    });
  }
};
