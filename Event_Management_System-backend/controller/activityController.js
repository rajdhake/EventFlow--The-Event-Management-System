const activitySchema = require("../models/activities");
const venueSchema = require("../models/venue");
const redis = require("../utils/redis");
const aws_sdk = require("@aws-sdk/client-s3");
const signedUrl = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");
const sharp = require("sharp");
const crypto = require("node:crypto");

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyAws = process.env.ACCESS_KEY_AWS;
const secretKeyAws = process.env.SECRET_KEY_AWS;

const s3Client = new aws_sdk.S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKeyAws,
    secretAccessKey: secretKeyAws,
  },
});

async function getSignedURLOfImage(image) {
  try {
    const params = new aws_sdk.GetObjectCommand({
      Bucket: bucketName,
      Key: image,
      Expires: 60 * 60 * 24 * 7,
    });
    const url = await signedUrl.getSignedUrl(s3Client, params, {
      expiresIn: 60 * 60 * 24 * 7,
    });
    return url.toString();
  } catch (error) {
    console.log("Error in getSignedURLOfImage: ", error);
  }
}

const randomImageName = () => {
  return crypto.randomBytes(20).toString("hex");
};

exports.createActivity = async (req, res) => {
  try {
    //only venueOwner and admin can create an activity
    if (
      req.user.role !== "venueOwner/eventPlanner" &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "Only venueOwner and admin can create an activity" });
    }
    const {
      name,
      description,
      venue,
      type_of_activity,
      date,
      start_time,
      end_time,
      participants_limit,
      price,
    } = req.body;
    const host = req.user._id;
    // if the venueOwner is the one creating the activity, the host will be the venueOwner and the activity will be approved
    // if the admin is the one creating the activity, the host will be the admin and the activity will be pending
    let venueDetails = await venueSchema.findById(venue).populate("venueOwner");
    let status = "pending";
    // check if there are any other bookings for the same slot
    const bookings = await activitySchema.find({
      venue,
      date,
      start_time,
      end_time,
    });
    if (bookings.length > 0) {
      return res.status(400).json({
        message: "There is already an activity booked for the same slot",
      });
    }
    const venueOwner = venueDetails.venueOwner;
    // if (venueOwner._id.toString() === host.toString()) {
    status = "approved";
    // }
    // check file upload for images
    // if (req.files.length > 1) {
    //   return res.status(400).json({ message: "Only 1 images is allowed" });
    // }
    const file = req.file;
    const buffer = await sharp(file.buffer)
      .png({
        quality: 80,
      })
      .toBuffer();
    file.buffer = buffer;
    const imageName = randomImageName();
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: file.buffer,
      ContentType: "image/png",
    };
    await s3Client.send(new aws_sdk.PutObjectCommand(params));
    const image = imageName;

    const activity = new activitySchema({
      name,
      description,
      venue,
      host,
      type_of_activity,
      date,
      start_time,
      end_time,
      participants_limit,
      price,
      image,
      status,
    });
    await activity.save();
    res
      .status(201)
      .json({ message: "Activity created successfully", activity });
  } catch (error) {
    console.log("Error:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    let activities = await activitySchema
      .find()
      .populate("venue", "name location")
      .populate("host", "name email")
      .populate("participants", "name email");
    if (!activities) {
      return res.status(404).json({ message: "No activity found" });
    }
    for (let i = 0; i < activities.length; i++) {
      activities[i] = activities[i].toObject();
      let url = await redis.get(`activity:${activities[i]._id}:image:0`);
      if (!url) {
        url = await getSignedURLOfImage(activities[i].image);
        redis.set(
          `activity:${activities[i]._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
      }
      activities[i].imageURL = url;
      // Check if the date of the activity has passed
      if (new Date(activities[i].date) < new Date()) {
        activities[i].active = false;
      }
      //set the date format to be in the format of "MM/DD/YYYY"
      let date = new Date(activities[i].date);
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let year = date.getFullYear();
      activities[i].date = month + "/" + day + "/" + year;
    }
    res.status(200).json(activities);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getUpcomingActivities = async (req, res) => {
  try {
    let activities = await activitySchema
      .find({ date: { $gte: new Date() } })
      .populate("venue", "name location")
      .populate("host", "name email")
      .populate("participants", "name email");
    if (!activities) {
      return res.status(404).json({ message: "No activity found" });
    }
    for (let i = 0; i < activities.length; i++) {
      activities[i] = activities[i].toObject();
      let url = await redis.get(`activity:${activities[i]._id}:image:0`);
      if (!url) {
        url = await getSignedURLOfImage(activities[i].image);
        redis.set(
          `activity:${activities[i]._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
      }
      activities[i].imageURL = url;
      //set the date format to be in the format of "MM/DD/YYYY"
      let date = new Date(activities[i].date);
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let year = date.getFullYear();
      activities[i].date = month + "/" + day + "/" + year;
    }
    res.status(200).json(activities);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getActivity = async (req, res) => {
  try {
    let activity = await activitySchema
      .findById(req.params.id)
      .populate("venue", "name location")
      .populate("host", "name email")
      .populate("participants", "name email");
    if (!activity) {
      return res.status(404).json({ message: "No activity found" });
    }
    activity = activity.toObject();
    let url = await redis.get(`activity:${activity._id}:image:0`);
    if (!url) {
      url = await getSignedURLOfImage(activity.image);
      redis.set(
        `activity:${activity._id}:image:0`,
        url,
        "EX",
        60 * 60 * 24 * 7
      );
    }
    activity.imageURL = url;

    // Check if the date of the activity has passed
    if (new Date(activity.date) < new Date()) {
      activity.active = false;
    }
    //set the date format to be in the format of "MM/DD/YYYY"
    let date = new Date(activity.date);
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let year = date.getFullYear();
    activity.date = month + "/" + day + "/" + year;
    res.status(200).json(activity);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getMyActivities = async (req, res) => {
  try {
    let activities = await activitySchema
      .find({ host: req.user._id })
      .populate("venue", "name location")
      .populate("host", "name email")
      .populate("participants", "name email");
    if (!activities) {
      return res.status(404).json({ message: "No activity found" });
    }
    for (let i = 0; i < activities.length; i++) {
      activities[i] = activities[i].toObject();
      let url = await redis.get(`activity:${activities[i]._id}:image:0`);
      if (!url) {
        url = await getSignedURLOfImage(activities[i].image);
        redis.set(
          `activity:${activities[i]._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
      }
      activities[i].imageURL = url;
      // Check if the date of the activity has passed
      if (new Date(activities[i].date) < new Date()) {
        activities[i].active = false;
      }
      //set the date format to be in the format of "MM/DD/YYYY"
      let date = new Date(activities[i].date);
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let year = date.getFullYear();
      activities[i].date = month + "/" + day + "/" + year;
    }
    //give set of participants for each activity so activity host can see who is participating in their activity
    //convert the participants to set so that there are no duplicate participants
    for (let activity of activities) {
      let participantsSet = new Set();
      for (let participant of activity.participants) {
        participantsSet.add(participant);
      }
      activity.participants = Array.from(participantsSet);
    }
    res.status(200).json(activities);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    if (
      req.user.role !== "venueOwner/eventPlanner" &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "Only venueOwner and admin can update an activity" });
    }
    const { id } = req.params;
    const activity = await activitySchema.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "No activity found" });
    }
    // if the activity is updated by other than the host who created the activity, then give an error
    if (activity.host.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const {
      name,
      description,
      venue,
      type_of_activity,
      date,
      time,
      participants_limit,
      price,
    } = req.body;
    if (req.file) {
      //delete the old images from the S3 bucket
      let params = {
        Bucket: bucketName,
        Key: activity.image,
      };
      await s3Client.send(new aws_sdk.DeleteObjectCommand(params));
      //upload the new image
      const file = req.file;
      const buffer = await sharp(file.buffer)
        .png({
          quality: 80,
        })
        .toBuffer();
      file.buffer = buffer;
      const imageName = randomImageName();
      params = {
        Bucket: bucketName,
        Key: imageName,
        Body: file.buffer,
        ContentType: "image/png",
      };
      await s3Client.send(new aws_sdk.PutObjectCommand(params));
      activity.image = imageName;
    } else {
      activity.image = activity.image;
    }
    if (name) activity.name = name;
    if (description) activity.description = description;
    if (venue) activity.venue = venue;
    if (type_of_activity) activity.type_of_activity = type_of_activity;
    if (date) activity.date = date;
    if (time) activity.time = time;
    if (participants_limit) activity.participants_limit = participants_limit;
    if (price) activity.price = price;
    await activity.save();
    res.status(200).json({ message: "Activity updated successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    if (
      req.user.role !== "venueOwner/eventPlanner" &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "Only venueOwner and admin can delete an activity" });
    }
    const { id } = req.params;
    const activity = await activitySchema.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "No activity found" });
    }
    // if the activity is deleted by other than the host who created the activity, then give an error
    if (activity.host.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await activitySchema.findByIdAndDelete(id);
    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.approveActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await activitySchema.findById(id).populate("venue");
    if (!activity) {
      return res.status(404).json({ message: "No activity found" });
    }
    const venueOwner = activity.venue.venueOwner;
    if (req.user._id.toString() !== venueOwner._id.toString()) {
      return res.status(401).json({
        message:
          "You are not the venue owner so you cannot approve the activity",
      });
    }
    await activitySchema.findByIdAndUpdate(id, { status: "approved" });
    res.status(200).json({ message: "Activity approved successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.rejectActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await activitySchema.findById(id).populate("venue");
    if (!activity) {
      return res.status(404).json({ message: "No activity found" });
    }
    const venueOwner = activity.venue.venueOwner;
    if (req.user._id.toString() !== venueOwner._id.toString()) {
      return res.status(401).json({
        message:
          "You are not the venue owner so you cannot reject the activity",
      });
    }
    await activitySchema.findByIdAndUpdate(id, { status: "rejected" });
    res.status(200).json({ message: "Activity rejected successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.searchActivities = async (req, res) => {
  try {
    const { search } = req.query;
    let activities;
    let activitiesList = [];

    if (search) {
      const regex = new RegExp(search, "i");
      activities = await activitySchema.find({
        $or: [
          { name: regex },
          { description: regex },
          { type_of_activity: regex },
          { location: regex },
        ],
      });
    } else {
      // If no search query is provided, return all activities
      activities = await activitySchema.find();
      for (let activity of activities) {
        activity = activity.toObject();
        let url = await redis.get(`activity:${activity._id}:image:0`);
        if (!url) {
          url = await getSignedURLOfImage(activity.image);
          redis.set(
            `activity:${activity._id}:image:0`,
            url,
            "EX",
            60 * 60 * 24 * 7
          );
        }
        activity.imageURL = url;
        // Check if the date of the activity has passed
        if (new Date(activity.date) < new Date()) {
          activity.active = false;
        }
        activitiesList.push(activity);
      }
      return res.status(200).json(activitiesList);
    }

    if (!activities) {
      return res.status(404).json({ message: "No activity found" });
    }
    for (let activity of activities) {
      activity = activity.toObject();
      let url = await redis.get(`activity:${activity._id}:image:0`);
      if (!url) {
        url = await getSignedURLOfImage(activity.image);
        redis.set(
          `activity:${activity._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
      }
      activity.imageURL = url;
      // Check if the date of the activity has passed
      if (new Date(activity.date) < new Date()) {
        activity.active = false;
      }
      activitiesList.push(activity);
    }
    res.status(200).json(activitiesList);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
