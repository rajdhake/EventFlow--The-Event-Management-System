const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv").config({ path: ".env" });
const path = require("path");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const redis = require("ioredis");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create a new express application instance
const app = express();
// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const PORT = process.env.PORT || 5000;

// Middleware
const router = express.Router();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// DB Config
const db = process.env.MONGO_URI;
mongoose
  .connect(db)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

// Routes
app.use("/users", require("./routes/userRoutes")); //EG: ->  locahost:5000/users/login
app.use("/venues", require("./routes/venueRoutes"));
app.use("/activities", require("./routes/activityRoutes"));
app.use("/venueBookings", require("./routes/venueBookingRoutes"));
app.use("/activityBookings", require("./routes/activityBookingRoutes"));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
