const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
let SALT_FACTOR = 8;

mongoose.set("useCreateIndex", true);

const applicantSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  password:{
    type: String,
  },
  regno: {
    type: String,
    unique: true
  },
  phone:{
    type:Number
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: "other"
  },
  compete: {
    type: Boolean,
    default: false
  },
  domain: {
    type: [String],
    minlength: 1
  },
  response: [
    {
      questionId: {
        type: mongoose.Schema.ObjectId,
        ref: "question"
      },
      userSolution: String,
    }
  ],
  status: {
    type: String,
    enum: ["approved", "reject", "hold", "invalid"],
    default: "hold"
  },
  overSmart: {
    type: Boolean,
    default: false
  },
  check: String,
  startTime: Number,
  endTime: Number,
  maxTime: Number,
  submitted: {
    type: Boolean,
    default: false
  },
  attempted: {
    type: Boolean,
    default: false
  }
});

applicantSchema.methods.generateHash = function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(SALT_FACTOR), null);
};

module.exports = mongoose.model("applicant", applicantSchema);
