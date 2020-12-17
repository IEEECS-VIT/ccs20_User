module.exports = {
  isLoggedIn: (req, res, next) => {
    console.log(req.user);
    if (req.isAuthenticated()) {
      console.log("yes, is authenticated.");
      return next();
    }
    console.log("auth failed");
    res.redirect("/");
  },
  isSelected:(req,res,next) => {
    if (!req.user.questionSelected) return next();
    res.redirect("/quiz");
  },
  check:(req,res,next)=>{
    if (req.user.questionSelected) {
      if(req.user.domainsLeft.length === 0){
        return res.redirect("/completed");
      }
      return res.redirect("/quiz");
    } 
    next(); 
  },
  isQuiz:(req,res,next) => {
    if (req.user.questionSelected) {
      if(req.user.domainsLeft.length === 0){
        return res.redirect("/thanks");
      }
      return next();
    }
    res.redirect("/domain");
  },
  isAuthenticated: (req, res, next) => {
    if (req.user && req.user._id && req.user.regno && req.user.regno.startsWith("20"))
      return next();
    console.log("Not Authenticated to enter");
    res.redirect("/");
  },
  isUser: (req,res,next) => {
    if(!req.user || !req.user._id){
      return next();
    }
    res.redirect("/instructions");
  }
};
