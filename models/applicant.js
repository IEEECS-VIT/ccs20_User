const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
let SALT_FACTOR = 8;

mongoose.set("useCreateIndex", true);

const applicantSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
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
  domainsLeft: [String],
  domains: Object,
});

applicantSchema.methods.generateHash = function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(SALT_FACTOR), null);
};

module.exports = mongoose.model("applicant", applicantSchema);
