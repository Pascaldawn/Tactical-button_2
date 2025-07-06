const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "This email already exists, Please use another email or login",
      });
    }
    const newUser = new User({
      fullName,
      email,
      password,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("Error creating user", error.message);
  }
};

module.exports = { registerUser };
