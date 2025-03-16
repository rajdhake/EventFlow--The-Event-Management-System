const bookingSchema = require("../models/venueBooking");

const venueSchema = require("../models/venue");
const userSchema = require("../models/user");

exports.createBooking = async (req, res) => {
  try {
    const { venueId, date, startTime, endTime } = req.body;
    const venue = await venueSchema.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    const user = await userSchema.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const booking = new bookingSchema({
      venue: venueId,
      user: req.user._id,
      date,
      startTime,
      endTime,
    });
    await booking.save();
    res.status(201).json({ message: "Booking created successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await bookingSchema.find({ user: req.user._id });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getVenueBookings = async (req, res) => {
  try {
    const bookings = await bookingSchema.find({ venue: req.params.id });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await bookingSchema.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    await booking.update({ status: status });
    res.status(200).json({ message: "Booking updated successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingSchema.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    await booking.delete();
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

