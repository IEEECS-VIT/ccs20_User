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
  domains: {
    type: [{
      name: {
        type: String,
        enum: ["technical", "design", "management", "documentation"],
        default: "management"
      },
      questions: [
        {
          questionId: {
            type: mongoose.Schema.ObjectId,
            ref: "question",
          },
          userSolution: {
            type: [String],
            minlength: 1,
          },
        },
      ],
      startTime: {
        type: Number,
        default: Date.now()
      },
      endTime: {
        type: Number,
        default: Date.now()
      }
    }],
    minlength: 1,
  },
  overSmart: {
    type: Boolean,
    default: false,
  },
  maxTime: Number,
  submitted: {
    type: Boolean,
    default: false,
  },
  attempted: {
    type: Boolean,
    default: false,
  },
});

applicantSchema.methods.generateHash = function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(SALT_FACTOR), null);
};

module.exports = mongoose.model("applicant", applicantSchema);
