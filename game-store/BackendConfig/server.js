const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const app = require("./app");
const User = require("./models/userModel");
const games = require("./models/gameModel");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  

  try {
    const rows = await games.getAllFilteredGames();
    console.log(rows);
  } catch (err) {
    console.error("Error: ", err.message);
  }
});

