const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Extract token from header
  const token = authHeader.split(" ")[1].replace(/['"]+/g, ""); // remove any stray quotes

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload to request
    next(); // Proceed to next middleware/route
  } catch (err) {
    console.error("Invalid token:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = verifyToken;
