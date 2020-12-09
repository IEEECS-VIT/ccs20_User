const Q_Database = require("../models/question");
const A_Database = require("../models/applicant");
const R_Databse = require("../models/response");
const { use } = require("passport");
module.exports.setQuestions = async id => {
  try {
    var user = await A_Database.findById(id);
    var domain = Object.keys(user.domains);
    console.log(domain);
    var Ques = await Q_Database.find(
      { qDomain: {$in: domain} },
      { _id: 1, qDomain: 1, qType: 1}
    ).lean();
    var domainArray= {},
        que, i;
    for (i = 0; i < domain.length; i++) {
      domainArray[domain[i]] = {
        subjective: [],
        objective: [],
      };
    }
    for (i = 0; i < Ques.length; i++) {
      que = Ques[i];
      if (que.isSubjective) {
        domainArray[que.qDomain].subjective.push(que._id);
      } else {
        domainArray[que.qDomain].objective.push(que._id);
      }
    }
    var index, temp, Sque, Oque, resultque;
    for (var ii = 0; ii < domain.length; ii++) {
      var newDomain = domain[ii];
      let response = new R_Databse();
      Sque = domainArray[newDomain].subjective;
      Oque = domainArray[newDomain].objective;
      resultque = [];
      if (newDomain !== "documentation") {
        for (i = Sque.length - 1; i > 0; i--) {
          index = Math.floor(Math.random() * (i + 1));
          temp = Sque[i];
          Sque[i] = Sque[index];
          Sque[index] = temp;
        }
        Sque = Sque.slice(0, 7);
        resultque.push.apply(resultque, Sque);
        for (i = Oque.length - 1; i > 0; i--) {
          index = Math.floor(Math.random() * (i + 1));
          temp = Oque[i];
          Oque[i] = Oque[index];
          Oque[index] = temp;
        }
        Oque = Oque.slice(0, 3);
        resultque.push.apply(resultque, Oque);
      } else {
        for (i = Sque.length - 1; i > 0; i--) {
          index = Math.floor(Math.random() * (i + 1));
          temp = Sque[i];
          Sque[i] = Sque[index];
          Sque[index] = temp;
        }
        Sque = Sque.slice(0, 4); // No of question is 5 for documentation
        resultque.push.apply(resultque, Sque);
      }
      resultque.forEach((qid)=>{
        response.data.push({
          questionId: qid,
          solution: "",
        });
      })
      await response.save();
      user.domains[newDomain] = response.id;
    }
    await user.save();
  } catch(error){
    console.log(error);
  }
};

module.exports.timeStatus = async id => {
    const data = await A_Database.findById(id, {});
    var startTime = data.startTime;
    var endTime = data.endTime;
    var maxTime = data.maxTime;
    var duration = endTime - startTime;
    var actDuration = duration - maxTime * 1000;
    actDuration = actDuration / 60000;
    var overSmart = false;
    if (actDuration > 5) {
      overSmart = true;
    }
    await A_Database.findByIdAndUpdate(id, { overSmart: overSmart });
};

module.exports.validate = userDetails => {
    var regno = userDetails.regno;
    var phone = userDetails.phone;
    var name = userDetails.name;
    var password = userDetails.Password;
    password = password.length;
    var message = "ok";
    // change it for the upcoming years
    var academicYear = "20";
    console.log("validating user input for :" + regno);
    var regNoRegex = new RegExp(`${academicYear}[A-Z]{3}[0-9]{3}[0-9]\$`);
    if (!regNoRegex.test(regno)) {
      message = "Invalid Reg No.";
      console.log("reg");
      return message;
    }
    var nameRegex = new RegExp("\^[a-zA-Z][a-zA-Z ]+[a-zA-Z]\$");
    if (!nameRegex.test(name)) {
      message = "Name should only have alphabets!";
      return message;
    }
    var phoneRegex = new RegExp("[1-9]{1}[0-9]{9}");
    if (!phoneRegex.test(phone)) {
      message = "Phone number format invalid";
      return message;
    }
    if (password < 8) {
      message = "Password length must be greater than 8 letters ";
      return message;
    }
    return message;
};
