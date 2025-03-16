const activityBookingController = require("../controller/activityBookingController");
const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

// Create a new booking
router.post("/", auth, activityBookingController.createActivityBooking);
// Retrieve all bookings
router.get("/", auth, activityBookingController.getAllActivityBookings);
// Retrieve a single booking with booking_id
router.get("/:id", auth, activityBookingController.getActivityBookingById);
// Update a booking with booking_id
router.put("/:id", auth, activityBookingController.updateActivityBooking);
// Delete a booking with booking_id
router.delete("/:id", auth, activityBookingController.deleteActivityBooking);
// get csv of bookings
router.get(
  "/csv/:activity_id",
  auth,
  activityBookingController.getPariticipantsOfActivityInCsv
);

module.exports = router;
