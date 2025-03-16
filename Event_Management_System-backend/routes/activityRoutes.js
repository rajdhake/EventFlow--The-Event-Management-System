const activityController = require("../controller/activityController");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post(
  "/",
  auth,
  upload.single("image"),
  activityController.createActivity
);
router.get("/", activityController.getUpcomingActivities);
router.get("/search", activityController.searchActivities);
router.get("/myactivities", auth, activityController.getMyActivities);
router.get("/:id", activityController.getActivity);
router.put(
  "/:id",
  auth,
  upload.single("image"),
  activityController.updateActivity
);
router.delete("/:id", auth, activityController.deleteActivity);

module.exports = router;
