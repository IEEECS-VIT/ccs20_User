const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  qid: Number,
  question: String,
  options: [String],
  answer: {
    type: [String],
    minlength: 1
  },
  isSubjective: {
    type: Boolean,
    default: false
  },
  qDomain: {
    type: String,
    enum: ["technical", "design", "management", "documentation"],
    default: "management"
  }
});

module.exports = mongoose.model("question", questionSchema);
