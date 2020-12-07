const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  qid: Number,
  question: String,
  options: {
    type: [String],
    minlength: 4,
  },
  answer: {
    type: [String],
    minlength: 1,
  },
  qType: {
    type: String,
    enum: ["multic", "descr", "singlec", "oneline"],
    default: "descr",
  },
  qDomain: {
    type: String,
    enum: ["technical", "design", "management", "documentation"],
    default: "management"
  },
});

module.exports = mongoose.model("question", questionSchema);
