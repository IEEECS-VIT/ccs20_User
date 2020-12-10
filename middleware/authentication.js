module.exports = {
  isLoggedIn: (req, res, next) => {
    console.log("tryna auth");
    console.log(req.user);
    if (req.isAuthenticated()) {
      console.log("yes, is authenticated.");
      return next();
    }
    console.log("auth failed");
    res.redirect("/");
  },
  domainNotSelected:(req,res,next) => {
    if (!req.user.domainSelected) return next();
    res.redirect("/quiz");
  },
  domainSelected:(req,res,next) => {
    if (req.user.domainSelected) return next();
    res.redirect("/domain");
  },
  isAuthenticated: (req, res, next) => {
    if (req.user && req.user._id && req.user.regno && req.user.regno.startsWith("20"))
      return next();
    console.log("Not Authenticated to enter");
    res.render("/");
  },
  isUser: (req,res,next) => {
    if(!req.user || !req.user._id){
      return next();
    }
    res.redirect("/check");
  }
};
