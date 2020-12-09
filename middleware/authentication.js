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
  isAttempt: (req, res, next) => {
    if (!req.user.attempted) return next();
    let message = "You have already Attampted the quiz.";
    res.render("thanks", { message });
  },
  isDomainSelected:(req,res,next) => {
    if (!req.user.domainSelected) return next();
    res.redirect("/quiz");
  },
  isSubmit: (req, res, next) => {
    if (!req.user.submitted) return next();
    let message = "You have already submitted the page.";
    res.render("thanks", { message });
  },
  isAuthenticated: (req, res, next) => {
    if (req.user)
      return next();
    console.log("Not Authenticated to enter");
    res.render("/");
  },
};
