const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const venueController = require("../controller/venueController");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.get("/", venueController.getVenues);
router.get("/myvenues", auth, venueController.getMyVenues);
router.get("/search", venueController.searchVenues);
router.get("/myvenues/search", auth, venueController.searchMyVenues);
router.get("/:id", venueController.getVenue);
router.get("/location/:location", venueController.getVenueByLocation);
router.post("/", auth, upload.single("image"), venueController.createVenue);
router.put("/:id", auth, upload.single("image"), venueController.updateVenue);
router.delete("/:id", auth, venueController.deleteVenue);

module.exports = router;
