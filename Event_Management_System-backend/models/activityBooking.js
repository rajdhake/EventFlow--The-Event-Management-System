const { boolean } = require("joi");
const moongose = require("mongoose");

const activityBookingSchema = new moongose.Schema(
  {
    user: {
      type: moongose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    activity: {
      type: moongose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    booking_date: {
      type: Date,
      required: true,
    },
    booking_time: {
      type: String,
      required: true,
    },
    booking_status: {
      type: String,
      required: true,
    },
    booking_price: {
      type: Number,
      required: true,
    },
    booking_quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = moongose.model("ActivityBooking", activityBookingSchema);
