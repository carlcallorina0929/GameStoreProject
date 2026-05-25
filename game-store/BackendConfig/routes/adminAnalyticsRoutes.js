const express = require("express");
const controller = require("../controllers/adminAnalyticsController");
const { verifyToken, verifyAdminRole } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(verifyToken, verifyAdminRole);

router.get("/summary", controller.getSummary);
router.get("/charts", controller.getCharts);

module.exports = router;
