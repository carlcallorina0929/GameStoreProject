require("dotenv").config();
const app = require("./app");
const User = require("./models/userModel");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  

  try {
    const rows = await User.getUsers();
    console.log(rows);
  } catch (err) {
    console.error("Error: ", err.message);
  }
});

