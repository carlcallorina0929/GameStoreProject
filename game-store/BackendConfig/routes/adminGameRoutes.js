const express = require("express");
const controller = require("../controllers/adminGameController");
const upload = require("../middleware/adminGameUpload");
const { verifyToken, verifyAdminRole } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(verifyToken, verifyAdminRole);

router.get("/", controller.listGames);
router.get("/genres", controller.listGenres);
router.post("/", upload.single("image"), controller.createGame);
router.put("/:id", upload.single("image"), controller.updateGame);
router.patch("/:id/soft-delete", controller.softDeleteGame);

module.exports = router;
