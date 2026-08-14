const express = require("express");
const router = express.Router();
const { loginAdmin, getCurrentAdmin, logoutAdmin } = require("../controllers/adminAuthController");
const { verifyToken, verifyAdminRole } = require("../middleware/adminAuthMiddleware");

router.post("/login", loginAdmin);
router.get("/me", verifyToken, verifyAdminRole, getCurrentAdmin);
router.post("/logout", logoutAdmin);

module.exports = router;