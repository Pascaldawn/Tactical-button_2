const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 5000;
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Nodejs tatical button app is started");
});

app.use("/api/v1/auth", authRoutes);

app.listen(PORT, (req, res) => {
  try {
    connectDB();
    console.log(`Server is started on the port ${PORT}`);
  } catch (error) {
    console.log("Error starting server", error.message);
  }
});
