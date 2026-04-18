const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Routes commented out as controller methods are no longer available
// router.get("/", userController.getUsers);
// router.get("/:id", userController.getUserById);
// router.post("/", userController.createUser);

module.exports = router;