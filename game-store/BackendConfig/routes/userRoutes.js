const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  checkUsernameAvailability,
  checkEmailAvailability,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser); 
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", logoutUser);
router.get("/check-username", checkUsernameAvailability);
router.get("/check-email", checkEmailAvailability);

module.exports = router;