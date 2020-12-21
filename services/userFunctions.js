const User = require("../models/applicant");
const userService = require("../services/userService");

/**
 * @function getUsers
 */
module.exports.getUsers = async () => {
  try {
    let users = await User.find({});
    return users;
  } catch (err) {
    next(err);
  }
}

/**
 * @function addUser
 * @param {Object}
 */
module.exports.addUser = async userDetails => {
  try {
    let user = await User.findOne({
      $or: [{ regno: userDetails.regno }, { email: userDetails.email }]
    })
    if (user) {
      return "User Already Registered";
    }
    var message = userService.validate(userDetails);
    // console.log(message);
    if (message !== "ok") return message;
    // console.log("Adding User:" + userDetails);
    let newUser = new User({
      name: userDetails.name.trim(),
      regno: userDetails.regno.trim(),
      gender: userDetails.gender,
      email: userDetails.email.trim(),
      password: userDetails.Password.trim(),
    });
    newUser.password = newUser.generateHash(userDetails.Password.trim());
    // console.log("password hashed");
    let savedUser = await newUser.save();
    if (savedUser) {
      return "ok";
    }
  } catch (error) {
    // console.log(error);
    return error;
  }
};

/**
 * @function deleteUser
 * @param {Object}
 */
module.exports.deleteUser = async (id) => {
    let user = await User.findByIdAndRemove(id)
    if (!user) {
      let error = new Error("User doesn't exist");
      return error;
    }
    return true;
};

/**
 * @function updateUser
 * @param {Object}
 */
module.exports.updateUser = async userDetails => {
    let user = await User.findByIdAndUpdate(
      userDetails._id,
      { $set: userDetails },
      { new: true }
    )
    if (!user) {
      return new Error("User not found");
    }
    return user;
};
