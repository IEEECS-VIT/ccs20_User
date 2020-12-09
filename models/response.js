const mongoose = require("mongoose");

const resSchema = new mongoose.Schema({
  submitted: {
    type: Boolean,
    default: false,
  },
  startTime: Number,
  endTime: Number,
  data: [
    {
      questionId: {
        type: mongoose.Types.ObjectId,
        ref: "question",
      },
      solution: String,
    },
  ],
});

module.exports = mongoose.model("response", resSchema);
