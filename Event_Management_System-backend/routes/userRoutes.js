const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controller/userController");

// user routes for registration, login, verification, and logout
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/verify/:id/:token", userController.verifyEmail);
router.get("/qrcode", auth, userController.qrCode);
router.post("/2fa", auth, userController.enableTwoFactorAuth);
router.get("/logout", auth, userController.logoutUser);

//get 2fa status
router.post("/2faStatus", userController.getUser2FAStatus);
router.get("/disable2fa", auth, userController.disableTwoFactorAuth);

//get user by username or email
//router.get("/search", auth, userController.getUserByEmailOrUsername);

router.get("/search", auth, userController.searchPeopleWithSimilarInterests);

// password routes
router.post("/forgotpassword", userController.forgetPassword);
router.post("/resetpassword", auth, userController.resetPassword);
router.get(
  "/verifyForgotPasswordLink/:userId/:token",
  userController.verifyTokenAndResetPasswordLink
);
router.post(
  "/changePassword",
  userController.resetForgotPasswordAfterVerification
);
// user profile routes
router.get("/", auth, userController.getAllUsers);
router.get("/profile", auth, userController.getUserProfile);
router.put("/profile", auth, userController.updateUserProfile);
router.get(
  "/similarInterests",
  auth,
  userController.getPeopleWithSimilarInterests
);
router.put("/interests", auth, userController.updateInterests);

// user dashboard routes
router.get("/customer/dashboard", auth, userController.CustomerDashboard);
router.get("/host/dashboard", auth, userController.HostDashboard);
router.get("/:id", auth, userController.getUserById);

module.exports = router;
