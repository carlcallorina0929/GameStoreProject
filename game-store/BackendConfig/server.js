const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const app = require("./app");
const User = require("./models/userModel");
const games = require("./models/gameModel");
const cart = require("./models/cartModel");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  

});

