const venueBookingController = require("../controller/venueBookingController.js");
const express = require("express");
const auth = require("../middleware/auth.js");
const router = express.Router();

// Create a new booking
router.post("/:venue_id", auth, venueBookingController.createAVenueBooking);
// Retrieve all bookings of a venue
router.get("/venue/:venue_id", auth, venueBookingController.findByVenue);
// Retrieve all bookings
router.get("/", auth, venueBookingController.findAllVenueBookings);
//Retrieve all upcoming bookings
router.get(
  "/upcoming",
  auth,
  venueBookingController.findMyUpcomingVenueBookings
);
// Retrieve a single booking with booking_id
router.get("/:booking_id", auth, venueBookingController.findOne);
// Retrieve all bookings of a user
router.get("/user/:user_id", auth, venueBookingController.findByUser);
// Update a booking with booking_id
router.put("/:booking_id", auth, venueBookingController.update);
// Delete a booking with booking_id
router.delete("/:booking_id", auth, venueBookingController.deleteBooking);
// Get Available Slots
router.get(
  "/available/:venue_id",
  auth,
  venueBookingController.getAvailableSlots
);

module.exports = router;
