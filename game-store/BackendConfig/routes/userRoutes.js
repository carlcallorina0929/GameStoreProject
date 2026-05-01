const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  checkUsernameAvailability,
  checkEmailAvailability,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser); 
router.get("/check-username", checkUsernameAvailability);
router.get("/check-email", checkEmailAvailability);

module.exports = router;
