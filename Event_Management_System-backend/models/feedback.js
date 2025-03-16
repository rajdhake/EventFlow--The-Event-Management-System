const moongose = require("mongoose");

const feedbackSchema = new moongose.Schema({
  user: {
    type: moongose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

module.exports = moongose.model("Feedback", feedbackSchema);
