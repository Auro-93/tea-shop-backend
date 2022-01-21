import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ errorMessage: "Invalid Authentication" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded._id || decoded.user._id);

      if (!user) {
        return res.status(404).json({ errorMessage: "No user found" });
      }

      req.user = user;

      next();
    } catch (error) {
      return res.status(500).json({ errorMessage: error.message });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: "Not authorized" });
  }
};

export const authAdminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
    });
    if (req.user.role === 0) {
      return res
        .status(400)
        .json({ errorMessage: "Not Authorized. Admin private route." });
    }
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ errorMessage: "Not Authorized. Admin private route." });
  }
};

export const authUserMiddleware = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
    });
    if (req.user.role === 1) {
      return res
        .status(400)
        .json({ errorMessage: "Not Authorized. User private route." });
    }
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ errorMessage: "Not Authorized. User private route." });
  }
};
