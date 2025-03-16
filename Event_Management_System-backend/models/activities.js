const moongose = require("mongoose");

const activitySchema = new moongose.Schema({
  host: {
    type: moongose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  venue: {
    type: moongose.Schema.Types.ObjectId,
    ref: "Venue",
    required: true,
  },
  type_of_activity: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  start_time: {
    type: String,
    required: true,
  },
  end_time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  participants_limit: {
    type: Number,
    required: true,
  },
  participants: [
    {
      type: moongose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  price: {
    type: Number,
    required: true,
    validate: {
      validator: function (v) {
        return /^[0-9]+(\.[0-9]{1,})?$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid price! Price must be a number and can contain up to 2 decimal places.`,
    },
  },
  dateLastUpdated: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
  feedback: [
    {
      type: moongose.Schema.Types.ObjectId,
      ref: "Feedback",
    },
  ],
});

activitySchema.index({
  name: "text",
  description: "text",
  type_of_activity: "text",
  date: "text",
  price: "number",
});

module.exports = moongose.model("Activity", activitySchema);
