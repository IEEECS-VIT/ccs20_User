const Q_Database = require("../models/question");
const A_Database = require("../models/applicant");
const R_Databse = require("../models/response");

module.exports.setQuestions = async (id, domain) => {
  try {
    var user = await A_Database.findById(id);
    if (user.domains){
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
    var index, len;
    for (let ii = 0; ii < domain.length; ii++) {
      let newDomain = domain[ii];
      let response = new R_Databse();
      let mque = domainArray[newDomain]["multic"];
      let sque = domainArray[newDomain]["singlec"];
      let dque = domainArray[newDomain]["descr"];
      let oque = domainArray[newDomain]["oneline"];
      let resultque = [];
      if (newDomain !== "documentation") {
        len = mque.length;
        for (i = 0; i < 2; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(mque[index]);
          mque[index] = mque[len - 1];
          len -= 1;
        }
        len = sque.length;
        for (i = 0; i < 2; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(sque[index]);
          sque[index] = sque[len - 1];
          len -= 1;
        }
        len = dque.length;
        for (i = 0; i < 3; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(dque[index]);
          dque[index] = dque[len - 1];
          len -= 1;
        }
        len = oque.length;
        for (i = 0; i < 3; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(oque[index]);
          oque[index] = oque[len - 1];
          len -= 1;
        }
      } else {
        len = dque.length;
        for (i = 0; i < 5; i++) {
          index = Math.floor(Math.random() * len);
          resultque.push(dque[index]);
          dque[index] = dque[len - 1];
          len -= 1;
        }
      }
      console.log(newDomain);
      console.log(resultque);
      resultque.forEach((qid) => {
        response.data.push({
          questionId: qid,
          solution: "",
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

module.exports.timeStatus = async (id) => {
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

module.exports.validate = (userDetails) => {
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
  var nameRegex = new RegExp("^[a-zA-Z][a-zA-Z ]+[a-zA-Z]$");
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
