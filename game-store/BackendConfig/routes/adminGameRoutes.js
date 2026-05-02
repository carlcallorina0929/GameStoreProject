const express = require("express");
const router = express.Router();
const db = require("../db");
const upload = require("../middleware/upload");

// ADD GAME (ADMIN)
router.post("/games", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price } = req.body;

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    await db.query(
      `INSERT INTO games (title, description, price, image_url)
       VALUES (?, ?, ?, ?)`,
      [title, description, price, imageUrl]
    );

    res.json({ message: "Game added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;