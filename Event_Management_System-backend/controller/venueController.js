const venueSchema = require("../models/venue");
const crypto = require("node:crypto");
const aws_sdk = require("@aws-sdk/client-s3");
const signedUrl = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");
const sharp = require("sharp");
const path = require("path");
const redis = require("../utils/redis");
const { parse, format, addHours, set } = require("date-fns");
dotenv.config();

const randomImageName = () => {
  return crypto.randomBytes(16).toString("hex");
};

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

exports.createVenue = async (req, res) => {
  // console.log("req.body: ", req.body);
  // console.log("req.file: ", req.file);
  try {
    let { name, location, type, capacity, price, description, timings } =
      req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!location)
      return res.status(400).json({ message: "Location is required" });
    if (!type) return res.status(400).json({ message: "Type is required" });
    if (!capacity)
      return res.status(400).json({ message: "Capacity is required" });
    if (!price) return res.status(400).json({ message: "Price is required" });
    if (!description)
      return res.status(400).json({ message: "Description is required" });
    if (!timings)
      return res.status(400).json({ message: "Timings is required" });
    if (!req.file)
      return res.status(400).json({ message: "Image is required" });

    const venueOwner = req.user._id;
    let venue = await venueSchema.findOne({
      name: name,
      location: location,
    });
    if (venue) {
      return res.status(400).json({ message: "Venue already exists" });
    }

    let image;
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 500, height: 500 })
        .toBuffer();
      req.file.buffer = buffer;
      const fileName = randomImageName();
      const params = {
        Bucket: bucketName,
        Body: req.file.buffer,
        Key: fileName,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new aws_sdk.PutObjectCommand(params));
      image = fileName;
    } else {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // if timings is in json format like this :
    // timings: '{"day":"monday","slots":[{"from":"10:00 PM","to":"11:00 PM"}]}'
    // then convert it to array of objects like this:
    // timings: [
    //   {
    //     day: "monday",
    //     slots: [
    //       {
    //         from: "10:00 PM",
    //         to: "11:00 PM",
    //       },
    //     ],
    //   },
    // ]
    if (typeof timings === "string") {
      const tempTimings = timings;
      timings = [];
      timings = timings.concat(tempTimings);
    }
    // Parse timings array from string to object
    // Parse timings array from string to object
    const updatedTimings = timings.map((timingObj) => {
      timingObj = JSON.parse(timingObj);
      return {
        day: timingObj.day,
        slots: timingObj.slots.reduce((acc, slot) => {
          let fromTime = parse(slot.from, "hh:mm aa", new Date());
          let toTime = parse(slot.to, "hh:mm aa", new Date());
          let current = fromTime;
          if (format(toTime, "h:mm aa") === "12:00 AM") {
            toTime = set(toTime, { hours: 23, minutes: 59 });
          }
          while (current < toTime) {
            const nextHour = addHours(current, 1);
            acc.push({
              from: format(current, "hh:mm aa"),
              to: format(nextHour, "hh:mm aa"),
            });
            current = nextHour;
          }
          return acc;
        }, []),
      };
    });

    venue = new venueSchema({
      name,
      location,
      type,
      capacity,
      pricePerHour: price,
      description,
      timings: updatedTimings,
      image,
      venueOwner,
    });
    await venue.save();
    res.status(201).json({ message: "Venue created successfully", venue });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
};

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

// get venue by id
exports.getVenue = async (req, res) => {
  try {
    let venue = await venueSchema
      .findById(req.params.id)
      .populate("venueOwner", "username email firstName lastName");
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    venue = venue.toObject();
    // check redis for the image URL
    let url = await redis.get(`venue:${venue._id}:image:0`);
    if (url) {
      // console.log("URL from Redis in if: ", url);
      venue.imageURL = url;
    } else {
      // If image URL does not exist or is expired, get a new signed URL
      url = await getSignedURLOfImage(venue.image);
      // Store the URL in Redis, set to expire after 7 days
      // const redis_response = await redis.set(
      await redis.set(
        `venue:${venue._id}:image:0`,
        url,
        "EX",
        60 * 60 * 24 * 7
      );
      // console.log("URL from Redis in else: ", redis_response.toString());
      venue.imageURL = url;
    }
    //add price to each slot
    for (let timing of venue.timings) {
      for (let slot of timing.slots) {
        slot.price = venue.pricePerHour;
      }
    }
    // Send the venue and imageURL as the response
    res.status(200).json({ venue });
  } catch (error) {
    // If an error occurs, send a 404 response with the error message
    res.status(404).json({ message: error.message });
  }
};

//get all venues
exports.getVenues = async (req, res) => {
  try {
    let venues = await venueSchema
      .find()
      .populate("venueOwner", "username email firstName lastName");
    if (!venues) {
      return res.status(404).json({ message: "Venues not found" });
    }
    const venues_json = {};
    // Iterate over each venue
    for (let venue of venues) {
      venue = venue.toObject();
      // Check Redis for the image URLs
      let url = await redis.get(`venue:${venue._id}:image:0`);
      if (url) {
        venue.imageURL = url;
        for (let timing of venue.timings) {
          for (let slot of timing.slots) {
            slot.price = venue.pricePerHour;
          }
        }
        venues_json[venue._id] = venue;
      } else {
        // If image URL does not exist or is expired, get a new signed URL
        url = await getSignedURLOfImage(venue.image);
        // Store the URL in Redis, set to expire after 7 days
        await redis.set(
          `venue:${venue._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
        venue.imageURL = url;
        //add price to each slot
        for (let timing of venue.timings) {
          for (let slot of timing.slots) {
            slot.price = venue.pricePerHour;
          }
        }
        console.log("venue: ", venue);
        venues_json[venue._id] = venue;
      }
    }
    // Send the venues and imageURL as the response
    res.status(200).json({ venues: venues_json });
  } catch (error) {
    // If an error occurs, send a 404 response with the error message
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

exports.getVenueByLocation = async (req, res) => {
  try {
    let venues = await venueSchema
      .find({ location: req.params.location })
      .populate("venueOwner", "username email");
    if (!venues) {
      return res.status(404).json({ message: "Venue not found" });
    }
    for (let venue of venues) {
      venue = venue.toObject();
      let venues_json = {};
      let url = await redis.get(`venue:${venue._id}:image:0`);
      if (url) {
        venue.imageURL = url;
        venues_json[venue._id] = venue;
      } else {
        url = await getSignedURLOfImage(venue.image);
        await redis.set(
          `venue:${venue._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
        venue.imageURL = url;
        venues_json[venue._id] = venue;
      }
    }
    res.status(200).json({ venues: venues_json });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getVenueByType = async (req, res) => {
  try {
    const venues = await venueSchema
      .find({ type: req.params.type })
      .populate("venueOwner", "username email");
    if (!venues) {
      return res.status(404).json({ message: "Venue not found" });
    }
    for (let venue of venues) {
      venue = venue.toObject();
      let url = await redis.get(`venue:${venue._id}:image:0`);
      if (url) {
        venue.imageURL = url;
      } else {
        url = await getSignedURLOfImage(venue.image);
        await redis.set(
          `venue:${venue._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
        venue.imageURL = url;
      }
    }
    res.status(200).json(venues);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// for update delete the previous images and add new images
exports.updateVenue = async (req, res) => {
  try {
    let {
      name,
      location,
      type,
      capacity,
      price,
      description,
      timings,
      availability,
    } = req.body;
    const venue = await venueSchema.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    if (
      venue.venueOwner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "You are not authorized to update this venue" });
    }
    if (name) venue.name = name;
    if (location) venue.location = location;
    if (type) venue.type = type;
    if (capacity) venue.capacity = capacity;
    if (price) venue.pricePerHour = price;
    if (description) venue.description = description;
    if (availability) venue.availability = availability;
    if (timings) {
      if (typeof timings === "string") {
        const tempTimings = timings;
        timings = [];
        timings = timings.concat(tempTimings);
      }
      venue.timings = timings.map((timingStr) => {
        const timingObj = JSON.parse(timingStr);
        return {
          day: timingObj.day,
          slots: timingObj.slots.reduce((acc, slot) => {
            let fromTime = parse(slot.from, "hh:mm aa", new Date());
            let toTime = parse(slot.to, "hh:mm aa", new Date());
            let current = fromTime;
            if (format(toTime, "h:mm aa") === "12:00 AM") {
              toTime = set(toTime, { hours: 23, minutes: 59 });
            }
            while (current < toTime) {
              const nextHour = addHours(current, 1);
              acc.push({
                from: format(current, "hh:mm aa"),
                to: format(nextHour, "hh:mm aa"),
              });
              current = nextHour;
            }
            return acc;
          }, []),
        };
      });
    }
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 500, height: 500 })
        .toBuffer();
      req.file.buffer = buffer;
      const fileName = randomImageName();
      const params = {
        Bucket: bucketName,
        Body: req.file.buffer,
        Key: fileName,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new aws_sdk.PutObjectCommand(params));
      venue.image = fileName;
    } else {
      venue.image = venue.image;
    }
    await venue.save();
    res.status(200).json({ message: "Venue updated successfully", venue });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    const venue = await venueSchema.findById(req.params.id);
    // admin and venue owner can delete the venue
    if (
      venue.venueOwner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this venue" });
    }
    const params = {
      Bucket: bucketName,
      Key: venue.image,
    };
    await s3Client.send(new aws_sdk.DeleteObjectCommand(params));
    await venueSchema.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Venue deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getMyVenues = async (req, res) => {
  try {
    const venues = await venueSchema
      .find({ venueOwner: req.user._id })
      .populate("venueOwner", "username email");
    if (!venues) {
      return res.status(404).json({ message: "Venues not found" });
    }
    const venues_json = {};
    for (let venue of venues) {
      venue = venue.toObject();
      let url = await redis.get(`venue:${venue._id}:image:0`);
      if (url) {
        venue.imageURL = url;
        venues_json[venue._id] = venue;
      } else {
        url = await getSignedURLOfImage(venue.image);
        await redis.set(
          `venue:${venue._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
        venue.imageURL = url;
        venues_json[venue._id] = venue;
      }
    }
    res.status(200).json({ venues: venues_json });
  } catch (error) {
    // If an error occurs, send a 404 response with the error message
    res.status(404).json({ message: error.message });
  }
};

exports.searchVenues = async (req, res) => {
  try {
    const { search } = req.query;
    let venues;
    let venues_json = {};
    if (search) {
      // Construct a regex pattern to search across all fields
      const regex = new RegExp(search, "i");
      venues = await venueSchema.find({
        $or: [
          { name: regex },
          { description: regex },
          { location: regex },
          { type: regex },
        ],
      });
    } else {
      // If no search query is provided, return all venues
      venues = await venueSchema.find();
    }

    // Populate image URLs and cache them if necessary
    for (let venue of venues) {
      venue = venue.toObject();
      let url = await redis.get(`venue:${venue._id}:image:0`);
      if (!url) {
        url = await getSignedURLOfImage(venue.image);
        await redis.set(
          `venue:${venue._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
      }
      venue.imageURL = url;
      venues_json[venue._id] = venue;
    }

    res.status(200).json({ venues: venues_json });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.searchMyVenues = async (req, res) => {
  try {
    const { search } = req.query;
    let venues;
    let venues_json = {};
    if (search) {
      // Construct a regex pattern to search across all fields
      const regex = new RegExp(search, "i");
      venues = await venueSchema.find({
        $or: [
          { name: regex },
          { description: regex },
          { location: regex },
          { type: regex },
        ],
        venueOwner: req.user._id,
      });
    } else {
      // If no search query is provided, return all venues
      venues = await venueSchema.find({ venueOwner: req.user._id });
    }

    if (venues.length === 0) {
      return res.status(404).json({ message: "Venues not found" });
    }

    // Populate image URLs and cache them if necessary
    for (let venue of venues) {
      venue = venue.toObject();
      let url = await redis.get(`venue:${venue._id}:image:0`);
      if (!url) {
        url = await getSignedURLOfImage(venue.image);
        await redis.set(
          `venue:${venue._id}:image:0`,
          url,
          "EX",
          60 * 60 * 24 * 7
        );
      }
      venue.imageURL = url;
      venues_json[venue._id] = venue;
    }

    res.status(200).json({ venues: venues_json });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
