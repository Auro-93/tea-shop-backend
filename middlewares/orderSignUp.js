import { User } from "../models/User.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const orderSignUp = async (req, res, next) => {
  const { order } = req.body;
  const { username, email, password1, password2 } = order;

  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      try {
        const alreadyExists = await User.findOne({ email });
        if (alreadyExists) {
          return res.status(409).json({ errorMessage: "User already exists" });
        }
        if (!username || !email || !password1 || !password2) {
          return res
            .status(400)
            .json({ errorMessage: "All fields are required" });
        }
        if (!validator.isEmail(email)) {
          return res.status(400).json({ errorMessage: "Invalid email" });
        }
        if (!validator.isLength(password1, { min: 6 })) {
          return res
            .status(400)
            .json({ errorMessage: "Password must be at least 6 characters" });
        }
        if (!validator.equals(password1, password2)) {
          return res
            .status(400)
            .json({ errorMessage: `Passwords don't match` });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password1, salt);
        if (!hashPassword) {
          return res
            .status(500)
            .json({ ErrorMessage: "Problems with password hashing" });
        }

        const user = new User({
          username,
          email,
          password: hashPassword,
        });

        user.save((err, success) => {
          if (err) {
            return res.status(400).json({ errorMessage: "Sign-up error" });
          }
          if (success) {
            req.user = user;
            next();
          }
        });
      } catch (error) {
        return res.status(500).json({ errorMessage: `${error}` });
      }
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
