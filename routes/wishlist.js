import express from "express";
import { authMiddleware, authUserMiddleware } from "../middlewares/auth.js";
import {
  updateWishListUser,
  getWishListUser,
} from "../controllers/wishlist-user.js";
import {
  updateWishListGuest,
  getWishListGuest,
} from "../controllers/wishlist-guest.js";

const router = express.Router();

router
  .route("/update-wishlist-user")
  .put(authMiddleware, authUserMiddleware, updateWishListUser);
router
  .route("/get-wishlist-user")
  .get(authMiddleware, authUserMiddleware, getWishListUser);
router.route("/update-wishlist-guest").put(updateWishListGuest);
router.route("/get-wishlist-guest").post(getWishListGuest);

export default router;
