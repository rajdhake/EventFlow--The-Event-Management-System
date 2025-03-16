// const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { authenticator } = require("otplib");
const userSchema = require("../models/user");
const Token = require("../models/token");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const sendEmail = require("../utils/email");
const ejs = require("ejs");
const express = require("express");
const blacklistTokenSchema = require("../models/blackListToken");
const venueSchema = require("../models/venue");
const activitySchema = require("../models/activities");
const venueBookingSchema = require("../models/venueBooking");
const activityBookingSchema = require("../models/activityBooking");
const venueBookingController = require("../controller/venueBookingController");
const activityBookingController = require("../controller/activityBookingController");
const user = require("../models/user");
var fs = require("fs");

const app = express();

app.set("view engine", "ejs");

// common for all controllers to create a user(customer, venueOwner, eventPlanner)
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      role,
      interestedIn,
    } = req.body;
    let user = await userSchema.findOne({ email: email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let newUser = await new userSchema({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role,
      interestedIn,
    }).save();

    let token = await new Token({
      userId: newUser._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const message = `${process.env.BASE_URL}/users/verify/${newUser._id}/${token.token}`;

    let userInfo = {
      username: newUser.firstName,
      email: newUser.email,
      link: message,
    };
    let mailOptions = {
      email: newUser.email,
      subject: "Verify your email address",
      text: "Welcome to Group 15 event management system",
      html: await ejs.renderFile(
        __dirname + "/../views/verification_email.ejs",
        {
          userInfo: userInfo,
        }
      ),
    };
    await sendEmail(
      mailOptions.email,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );
    console.log("LINK: ", message);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const user = await userSchema.findById(req.params.id);
    if (!user) return res.status(400).json({ message: "User does not exist" });
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    await userSchema.findByIdAndUpdate(user._id, { verified: true });
    await Token.findByIdAndDelete(token._id);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, code } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    let user = await userSchema.findOne({ email: email });
    if (!user) {
      user = await userSchema.findOne({ username: email });
    }
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.twoFactorAuthEnabled && !code) {
      return res
        .status(202)
        .json({ message: "Two factor authentication required" });
    }
    if (user.twoFactorAuthEnabled && code) {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorAuth,
      });
      if (!isValid) {
        return res.status(400).json({ message: "Invalid code" });
      }
    }
    // remove password from the user object
    user = user.toObject();
    delete user.password;
    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
      // expires in 7 day
      expiresIn: "7d",
    });
    user.token = token;
    res.status(200).json({ user, message: "Logged in successfully" });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
};

// in logout use the auth middleware to verify the user
exports.logoutUser = async (req, res) => {
  try {
    // remove the token from the user object and add it to the blacklist
    const token = req.token;
    console.log(token, "token");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userSchema.findById(verified.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await new blacklistTokenSchema({ token }).save();
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.qrCode = async (req, res) => {
  try {
    // console.log(req.token, "token");
    const token = req.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userSchema.findById(verified.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.twoFactorAuthEnabled) {
      return res
        .status(400)
        .json({ message: "Two factor authentication enabled" });
    }
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(
      user.email,
      "Event Management",
      secret
    );
    const qrCode = await qrcode.toDataURL(otpauth);
    user.twoFactorAuth = secret;
    await user.save();
    res.status(200).json({ qrCode, message: "QR code generated successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.enableTwoFactorAuth = async (req, res) => {
  try {
    const token = req.token;
    const { code } = req.body;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userSchema.findById(verified.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.twoFactorAuthEnabled) {
      return res
        .status(400)
        .json({ message: "Two factor authentication already enabled" });
    }
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorAuth,
    });
    if (!isValid) {
      return res.status(400).json({ message: "Invalid code" });
    }
    user.twoFactorAuthEnabled = true;
    await user.save();
    res.status(200).json({ message: "Two factor authentication enabled" });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
};

exports.disableTwoFactorAuth = async (req, res) => {
  try {
    const token = req.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userSchema.findById(verified.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.twoFactorAuthEnabled) {
      return res
        .status(400)
        .json({ message: "Two factor authentication already disabled" });
    }
    user.twoFactorAuthEnabled = false;
    user.twoFactorAuth = "";
    await user.save();
    res.status(200).json({ message: "Two factor authentication disabled" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword, code } = req.body;
    const user = await userSchema.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.twoFactorAuthEnabled && !code) {
      return res
        .status(202)
        .json({ message: "Two factor authentication required" });
    }
    if (user.twoFactorAuthEnabled && code) {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorAuth,
      });
      if (!isValid) {
        return res.status(400).json({ message: "Invalid code" });
      }
    }
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userSchema.findOne({
      email: email,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const userId = user._id;
    const message = `${process.env.BASE_URL}/users/verifyForgotPasswordLink/${userId}/${token.token}`;
    let userInfo = {
      username: user.username,
      email: user.email,
      link: message,
    };
    let mailOptions = {
      email: user.email,
      subject: "Reset your password",
      text: "Here's the link to reset your password",
      html: await ejs.renderFile(__dirname + "/../views/reset_password.ejs", {
        userInfo: userInfo,
      }),
    };
    await sendEmail(
      mailOptions.email,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );
    console.log("LINK: ", message);
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.verifyTokenAndResetPasswordLink = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const userData = await user.findOne({ _id: userId });
    // Find the token in the database
    const tokenData = await Token.findOne({ userId, token });

    let message;
    // If token is not found or is expired, send an error message
    if (!tokenData) {
      message = "Token not found or expired";
      var template = fs.readFileSync(
        __dirname + "/../views/forget_password.ejs",
        "utf-8"
      );
      var html = ejs.render(template, {
        email: userData.email,
        token: token,
        message: message,
      });
      res.end(html);
    }

    // Delete the token from the database
    await Token.deleteOne({ userId, token });
    var template = fs.readFileSync(
      __dirname + "/../views/forget_password.ejs",
      "utf-8"
    );
    var html = ejs.render(template, {
      email: userData.email,
      token: token,
      message: message,
    });
    res.end(html);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.resetForgotPasswordAfterVerification = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find the user by id
    const user = await userSchema.findOne({ email });

    //hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and save the user
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // get token from middleware auth and it is stored in req.user
    let user = await userSchema.findById({ _id: req.user._id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user = user.toObject();
    delete user.password;
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    let user = await userSchema.findById({ _id: req.user._id });
    let { firstName, lastName, username, email, phone, interestedIn } =
      req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (interestedIn) user.interestedIn = interestedIn;
    // update the user
    // interestedIn is a array of interests
    if (interestedIn) {
      interestedIn = interestedIn.split(",");
      user.interestedIn = interestedIn;
    }
    await userSchema.findByIdAndUpdate(user._id, user);
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = req.user;
    await user.remove();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userSchema.find();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userSchema.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserByEmailOrUsername = async (req, res) => {
  try {
    const { email, username } = req.body;
    let user;
    if (email) {
      user = await userSchema.findOne({ email: email }).select("-password");
    }
    if (username) {
      user = await userSchema.findOne({ username }).select("-password");
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUser2FAStatus = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await userSchema
      .findOne({ email: email })
      .select("twoFactorAuthEnabled");
    if (!user) {
      user = await userSchema
        .findOne({ username: email })
        .select("twoFactorAuthEnabled");
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ twoFactorAuthStatus: user.twoFactorAuthEnabled });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPeopleWithSimilarInterests = async (req, res) => {
  try {
    let users = await userSchema.find({ role: "customer" });
    users = users.map((user) => {
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        interestedIn: user.interestedIn,
        role: "customer",
      };
    });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchPeopleWithSimilarInterests = async (req, res) => {
  try {
    const { search } = req.query;
    let users;
    if (search) {
      const regex = new RegExp(search, "i");
      users = await userSchema.find({
        $or: [
          { username: regex },
          { email: regex },
          { interestedIn: regex },
          { firstName: regex },
          { lastName: regex },
        ],
        role: "customer",
      });
    } else {
      users = await userSchema.find();
    }
    users = users.map((user) => {
      return {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        interestedIn: user.interestedIn,
      };
    });
    res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPeople = async (req, res) => {
  try {
    let users = await userSchema.find();
    users = users.map((user) => {
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        interestedIn: user.interestedIn,
      };
    });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInterests = async (req, res) => {
  try {
    const user = req.user;
    let { interestedIn } = req.body;
    if (!interestedIn) {
      return res.status(400).json({ message: "Interests required" });
    }
    interestedIn = interestedIn.split(",");
    user.interestedIn = interestedIn;
    await user.save();
    res.status(200).json({ message: "Interests updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.CustomerDashboard = async (req, res) => {
  try {
    // it will contain past activitiesa and upcoming activities
    const user = req.user;

    // get all the activities booked by the user
    const activities = await activityBookingSchema
      .find({ user: user._id })
      .populate("activity", "name date start_time end_time participants_limit");
    const venues = await venueBookingSchema
      .find({ user: user._id })
      .populate("venue", "name")
      .select("booking_date booking_time_slot");
    const pastVenueBookings = [];
    const upcomingVenueBookings = [];
    const pastActivities = [];
    const upcomingActivities = [];
    const currentDate = new Date();
    activities.forEach((activity) => {
      if (activity.activity.date < currentDate) {
        pastActivities.push(activity);
      } else {
        upcomingActivities.push(activity);
      }
    });
    // if the activity id is same for multiple bookings then it will be counted as one and the participants will be added
    // to the participants array of the activity
    pastActivities.forEach((activity) => {
      const index = pastActivities.findIndex(
        (act) => act.activity.toString() === activity.activity.toString()
      );
      if (index !== -1) {
        pastActivities[index].participants =
          pastActivities[index].participants || [];
        pastActivities[index].participants.push(activity.user);
      }
    });
    upcomingActivities.forEach((activity) => {
      const index = upcomingActivities.findIndex(
        (act) => act.activity.toString() === activity.activity.toString()
      );
      if (index !== -1) {
        upcomingActivities[index].participants =
          upcomingActivities[index].participants || [];
        upcomingActivities[index].participants.push(activity.user);
      }
    });
    venues.forEach((venue) => {
      if (venue.booking_date < currentDate) {
        pastVenueBookings.push(venue);
      } else {
        upcomingVenueBookings.push(venue);
      }
    });
    res.status(200).json({
      venueBookings: { pastVenueBookings, upcomingVenueBookings },
      activityBookings: { pastActivities, upcomingActivities },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.HostDashboard = async (req, res) => {
  try {
    // send flag in req so that api can know that it need not to send the repose and it will be handled by the controller
    req.flag = true;
    const venueBookingPromise =
      await venueBookingController.findVenueBookingByOwner(req, res);
    const activityBookingPromise =
      await activityBookingController.getActivityBookingParticipantsCountOfAllActivitiesOfHost(
        req,
        res
      );

    const [venueBookings, activityBookings] = await Promise.all([
      venueBookingPromise,
      activityBookingPromise,
    ]);

    res.status(200).json({ venueBookings, activityBookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.UserDashboard = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === "customer") {
      return this.CustomerDashboard(req, res);
    }
    if (user.role === "venueOwner/eventPlanner") {
      return this.HostDashboard(req, res);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
