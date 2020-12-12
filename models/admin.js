const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
let SALT_FACTOR = 8;

const adminSchema = new mongoose.Schema({
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
  rating: {
    type: {
      user: {
        type: mongoose.Types.ObjectId,
        ref: "applicant",
      },
      domains: [{
        domain: String,
        rating: Number,
      }]
    }
  }
});

adminSchema.methods.generateHash = function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(SALT_FACTOR), null);
};

module.exports = mongoose.model("admin", adminSchema);
