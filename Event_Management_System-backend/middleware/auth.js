const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const blacklistToken = require("../models/blackListToken");
dotenv.config();

const user = require("../models/user");

const auth = async (req, res, next) => {
  // get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    // check if token is blacklisted
    const blacklisted = await blacklistToken.findOne({ token });
    if (blacklisted) return res.status(401).json({ message: "Token Expired" });
    // verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.exp < Date.now().valueOf() / 1000)
      return res.status(401).json({ message: "Token expired" });
    else if (!verified)
      return res.status(401).json({ message: "Unauthorized" });

    // find user
    const foundUser = await user.findById(verified.user._id);
    if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

    req.user = foundUser;
    req.token = token;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = auth;
