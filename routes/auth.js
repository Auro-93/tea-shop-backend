import express from "express";
import {
  signUp,
  signIn,
  googleLogin,
  forgotPassword,
  resetPassword,
  accountAuth,
  getUserByEmail,
  updateEmail,
  updateUserName,
} from "../controllers/auth.js";

import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.route("/sign-up").post(signUp);
router.route("/account-authentication/:token").post(accountAuth);
router.route("/sign-in").post(signIn);
router.route("/google-login").post(googleLogin);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/getUserByEmail").post(getUserByEmail);
router.route("/update-email").put(authMiddleware, updateEmail);
router.route("/update-username").put(authMiddleware, updateUserName);

export default router;
