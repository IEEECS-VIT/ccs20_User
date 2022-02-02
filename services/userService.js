const Q_Database = require("../models/question");
const A_Database = require("../models/applicant");
const R_Databse = require("../models/response");

module.exports.setQuestions = async (email, domain) => {
  console.log(email);
  try {
    var user = await A_Database.findOne(email);
    console.log(user);
    if (user.domains) {
      var responseObjects = Object.values(user.domains);
      if (responseObjects.length != 0) {
        await R_Databse.deleteMany({ _id: { $in: responseObjects } });
      }
    }
    user["domains"] = Object.create(null);
    console.log(domain);
    var Ques = await Q_Database.find(
      { qDomain: { $in: domain } },
      { _id: 1, qDomain: 1, qType: 1 }
    ).lean();
    console.log(Ques.length);
    var domainArray = {},
      que,
      i;
    for (i = 0; i < domain.length; i++) {
      domainArray[domain[i]] = {
        oneline: [],
        multic: [],
        singlec: [],
        descr: [],
      };
    }
    for (i = 0; i < Ques.length; i++) {
      que = Ques[i];
      domainArray[que.qDomain][que.qType].push(que._id);
    }
    var index, len, xlen;
    for (let ii = 0; ii < domain.length; ii++) {
      let newDomain = domain[ii];
      let response = new R_Databse();
      let mque = domainArray[newDomain]["multic"];
      let sque = domainArray[newDomain]["singlec"];
      let dque = domainArray[newDomain]["descr"];
      let oque = domainArray[newDomain]["oneline"];
      let resultque = [];
      if (newDomain === "technical") {
        len = mque.length;
        xlen = Math.min(2,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(mque[index]);
          mque[index] = mque[len - 1];
          len -= 1;
        }
        len = sque.length;
        xlen = Math.min(3,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(sque[index]);
          sque[index] = sque[len - 1];
          len -= 1;
        }
        len = dque.length;
        xlen = Math.min(2,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(dque[index]);
          dque[index] = dque[len - 1];
          len -= 1;
        }
        len = oque.length;
        xlen = Math.min(3,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(oque[index]);
          oque[index] = oque[len - 1];
          len -= 1;
        }
      } else if (newDomain === "design") {
        len = mque.length;
        xlen = Math.min(1,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(mque[index]);
          mque[index] = mque[len - 1];
          len -= 1;
        }
        len = sque.length;
        xlen = Math.min(1,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(sque[index]);
          sque[index] = sque[len - 1];
          len -= 1;
        }
        len = dque.length;
        xlen = Math.min(3,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(dque[index]);
          dque[index] = dque[len - 1];
          len -= 1;
        }
        len = oque.length;
        xlen = Math.min(1,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(oque[index]);
          oque[index] = oque[len - 1];
          len -= 1;
        }
      } else {
        len = dque.length;
        xlen = Math.min(3,len);
        for (i = 0; i < xlen; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(dque[index]);
          dque[index] = dque[len - 1];
          len -= 1;
        }
      }
      resultque.forEach((qid) => {
        response.data.push({
          questionId: qid,
          solution: [],
        });
      });
      user["domains"][newDomain] = response.id;
      await response.save();
    }
    user.questionSelected = true;
    await user.save();
  } catch (error) {
    console.log(error);
  }
};

module.exports.timeStatus = async (email) => {
  const data = await A_Database.find(email, {});
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
  await A_Database.findOneAndUpdate(email, { overSmart: overSmart });
};

module.exports.validate = (userDetails) => {
  var regno = userDetails.regno.trim();
  var phone = userDetails.phone.trim();
  var name = userDetails.name.trim();
  var pwd1 = userDetails.Password.trim();
  var email = userDetails.email.trim();
  var message = "ok";
  var nameRegex = new RegExp(/^[a-zA-Z][a-zA-Z\s]+[a-zA-Z]$/);
  if (!nameRegex.test(name)) {
    return "Name Should Only Consist of Letters!";
  }
  // change it for the upcoming years
  var regNoRegex = new RegExp(/^20[A-Z]{3}[0-9]{3}[0-9]$/);
  if (!regNoRegex.test(regno)) {
    return "Invalid Reg No.";
  }
  var emailRegex = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  if (!emailRegex.test(email)) {
    return "Invalid Email Address";
  }
  if (
    pwd1.length < 8 ||
    !new RegExp(/[A-Z]+/).test(pwd1) ||
    !new RegExp(/[a-z]+/).test(pwd1) ||
    !new RegExp(/\W/).test(pwd1) ||
    !new RegExp(/[0-9]+/).test(pwd1)
  ) {
    return "Password Not Strong Enough! Must contain One Digit, LowerCase, UpperCase and Special Character and at least of length 8";
  }
  var phoneRegex = new RegExp("[1-9]{1}[0-9]{9}");
  if (!phoneRegex.test(phone)) {
    return "Phone number format invalid";
  }
  return message;
};
