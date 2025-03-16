const activityBooking = require("../models/activityBooking");
const activity = require("../models/activities");
const user = require("../models/user");
const redis = require("../utils/redis");
const csvWriter = require("csv-writer");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// create a new activity booking
exports.createActivityBooking = async (req, res) => {
  try {
    let { activityId, bookingQuantity, phone } = req.body;
    const userId = req.user._id;

    let activityDetails = await activity.findById(activityId);
    if (!activityDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }
    // add the user to the activity. If the quantity is more than the available slots, return an error and also push that user to the participants array times the quantity
    if (activityDetails.participants_limit < bookingQuantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough slots available",
      });
    } else {
      for (let i = 0; i < bookingQuantity; i++) {
        activityDetails.participants.push(userId);
      }
      //also decrease the available slots by the quantity
      activityDetails.participants_limit -= bookingQuantity;
    }
    await activityDetails.save();
    const newActivityBooking = new activityBooking({
      user: userId,
      activity: activityId,
      phone: phone,
      booking_date: new Date().toISOString().slice(0, 10),
      booking_time: new Date().toISOString().slice(11, 19),
      booking_status: "booked",
      booking_price: activityDetails.price * bookingQuantity,
      booking_quantity: bookingQuantity,
    });

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: activityDetails.name,
          },
          unit_amount: Math.round(activityDetails.price * 100),
        },
        quantity: bookingQuantity,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    const savedActivityBooking = await newActivityBooking.save();

    // // store the phone number of the user in redis and set expiry when the activity ends
    await redis.set(
      `user:${userId}:activityBooking:${savedActivityBooking._id}:phone`,
      phone,
      "EX",
      60 * 60 * 24 * 7
    );

    res.status(201).json({
      success: true,
      message: "Activity booking created successfully",
      // data: savedActivityBooking,
      data: newActivityBooking,
      sessionId: session.id,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// get all activity bookings
exports.getAllActivityBookings = async (req, res) => {
  try {
    const activityBookings = await activityBooking.find();
    res.status(200).json({
      success: true,
      data: activityBookings,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// get activity booking by id
exports.getActivityBookingById = async (req, res) => {
  try {
    const activityBookingId = req.params.id;
    const activityBookingDetails = await activityBooking.findById(
      activityBookingId
    );
    if (!activityBookingDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity booking not found",
      });
    }
    res.status(200).json({
      success: true,
      data: activityBookingDetails,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// update activity booking quantity within next 48 hours and if the activity is in next 48 hours, return an error
//activity's time is int activitySchema that is activity in our case and it is known as date and time
exports.updateActivityBooking = async (req, res) => {
  try {
    const activityBookingId = req.params.id;
    const { bookingQuantity } = req.body;

    const activityBookingDetails = await activityBooking.findById(
      activityBookingId
    );
    if (!activityBookingDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity booking not found",
      });
    }

    const activityDetails = await activity.findById(
      activityBookingDetails.activity
    );
    if (!activityDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // check if the activity is within the next 48 hours
    const activityTime = new Date(
      `${activityDetails.date}T${activityDetails.time}`
    );
    const currentTime = new Date();
    const timeDifference = Math.abs(activityTime - currentTime);
    const hoursDifference = Math.ceil(timeDifference / (1000 * 60 * 60));

    if (hoursDifference <= 48) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update activity booking within 48 hours of the activity",
      });
    }

    // check if the new quantity is more than the available slots
    const quantityDifference =
      bookingQuantity - activityBookingDetails.booking_quantity;
    if (quantityDifference > activityDetails.participants_limit) {
      return res.status(400).json({
        success: false,
        message: "Not enough slots available",
      });
    } else {
      // add the user to the activity. If the quantity is more than the available slots, return an error and also push that user to the participants array times the quantity
      if (quantityDifference > 0) {
        for (let i = 0; i < quantityDifference; i++) {
          activityDetails.participants.push(activityBookingDetails.user);
        }
        //also decrease the available slots by the quantity
        activityDetails.participants_limit -= quantityDifference;
      } else {
        // remove the user from the activity
        for (let i = 0; i < Math.abs(quantityDifference); i++) {
          const index = activityDetails.participants.indexOf(
            activityBookingDetails.user
          );
          if (index > -1) {
            activityDetails.participants.splice(index, 1);
          }
        }
        //also increase the available slots by the quantity
        activityDetails.participants_limit += Math.abs(quantityDifference);
      }
    }
    await activityDetails.save();

    activityBookingDetails.booking_quantity = bookingQuantity;

    const updatedActivityBooking = await activityBookingDetails.save();
    res.status(200).json({
      success: true,
      message: "Activity booking updated successfully",
      data: updatedActivityBooking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteActivityBooking = async (req, res) => {
  try {
    const activityBookingId = req.params.id;
    const activityBookingDetails = await activityBooking.findById(
      activityBookingId
    );
    if (!activityBookingDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity booking not found",
      });
    }

    const activityDetails = await activity.findById(
      activityBookingDetails.activity
    );
    if (!activityDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // check if the activity is within the next 48 hours
    const activityTime = new Date(
      `${activityDetails.date}T${activityDetails.time}`
    );
    const currentTime = new Date();
    const timeDifference = Math.abs(activityTime - currentTime);
    const hoursDifference = Math.ceil(timeDifference / (1000 * 60 * 60));

    if (hoursDifference <= 48) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete activity booking within 48 hours of the activity",
      });
    }

    // remove the user from the activity
    for (let i = 0; i < activityBookingDetails.booking_quantity; i++) {
      const index = activityDetails.participants.indexOf(
        activityBookingDetails.user
      );
      if (index > -1) {
        activityDetails.participants.splice(index, 1);
      }
    }
    //also increase the available slots by the quantity
    activityDetails.participants_limit +=
      activityBookingDetails.booking_quantity;

    await activityDetails.save();

    await activityBookingDetails.remove();

    res.status(200).json({
      success: true,
      message: "Activity booking deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getActivityBookingParticipantsCountOfAllActivitiesOfHost = async (
  req,
  res
) => {
  try {
    const userId = req.user._id;
    //show the length of the participants array of all activities of the host
    // get just activity name and the number of participants in that activity
    let pastActivities = [];
    let upcomingActivities = [];
    let activities = await activity
      .find({ host: userId })
      .select("name participants date");
    activities.forEach((activity) => {
      let participantsCount = activity.participants.length;
      let activityName = activity.name;
      let activityDetails = {
        activityName,
        participantsCount,
      };
      if (activity.date < new Date()) {
        pastActivities.push(activityDetails);
      } else {
        upcomingActivities.push(activityDetails);
      }
    });

    if (req.flag) {
      return {
        pastActivities,
        upcomingActivities,
      };
    } else {
      res.status(200).json({
        success: true,
        pastActivities,
        upcomingActivities,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//pass activity_id in the url
exports.getPariticipantsOfActivityInCsv = async (req, res) => {
  try {
    const activityId = req.params.activity_id;
    const activityDetails = await activity.findById(activityId);
    if (!activityDetails) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }
    const participants = await user.find({
      _id: { $in: activityDetails.participants },
    });
    //get phone number of participants from redis and add it to the participants array
    let participantsWithPhoneNumbers = [];
    for (let i = 0; i < participants.length; i++) {
      let phoneNumber = await redis.get(
        `user:${participants[i]._id}:activityBooking:${activityId}:phone`
      );
      if (!phoneNumber) {
        //generate a random phone number if not available
        phoneNumber = Math.floor(Math.random() * 1000000000);
      }
      participantsWithPhoneNumbers.push({
        name: participants[i].firstName + " " + participants[i].lastName,
        email: participants[i].email,
        phone: phoneNumber,
      });
    }

    //give output in json format
    res.status(200).json({
      success: true,
      data: participantsWithPhoneNumbers,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
