const express = require("express");
const controller = require("../controllers/adminUserController");
const { verifyToken, verifyAdminRole } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(verifyToken, verifyAdminRole);

router.get("/", controller.listUsers);
router.post("/", controller.createUser);
router.put("/:id", controller.updateUser);
router.patch("/:id/soft-delete", controller.softDeleteUser);

module.exports = router;
