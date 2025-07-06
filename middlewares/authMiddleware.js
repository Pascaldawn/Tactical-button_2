const jwt = require("jsonwebtoken");
const createError = require("../utils/error");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies.accessToken;

  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (tokenFromCookie) {
    token = tokenFromCookie;
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  token = token.replace(/['"]+/g, "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = verifyToken;
