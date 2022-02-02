const mongoose = require("mongoose");

//mongoose.set("useCreateIndex", true);

const Feedback = new mongoose.Schema({
  
  ID:{
    type:String
  },
  Question1: {
    type: Number,
  },
  Question2: {
    type: Number,
  },
  Question3: {
    type: Number,
  },
  Question4: {
    type: Number,
  },
  Question5: {
    type: Number,
  },
  Message: {
    type: String,
  }
});

module.exports = mongoose.model("Feedback", Feedback);