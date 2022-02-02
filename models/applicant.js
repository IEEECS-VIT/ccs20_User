const mongoose = require("mongoose");
// const bcrypt = require("bcrypt-nodejs");
// let SALT_FACTOR = 8;

// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
      type: String,
      unique: true,
  },
  regno: {
    type: String,
    unique: true,
  },
  phone: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: "other",
  },
  compete: {
    type: Boolean,
    default: false,
  },
  questionSelected: {
    type: Boolean,
    default: false,
  },
  registered: {
    type: Boolean,
    default: false,
  },
  isFeedback:{
    type: Boolean,
    default:false
  },
  domainsLeft: [String],
  domains: Object,
});

module.exports = mongoose.model("user", userSchema);
