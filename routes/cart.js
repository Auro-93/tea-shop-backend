import express from "express";
import { authMiddleware, authUserMiddleware } from "../middlewares/auth.js";
import {
  addToCartUser,
  getCartItemsUser,
  removeFromCartUser,
} from "../controllers/cart-user.js";
import {
  getCartItemsGuest,
  addToCartGuest,
  removeFromCartGuest,
} from "../controllers/cart-guest.js";

const router = express.Router();

router
  .route("/add-item-to-cart-user")
  .put(authMiddleware, authUserMiddleware, addToCartUser);
router.route("/add-item-to-cart-guest").put(addToCartGuest);
router
  .route("/delete-cart-item-user")
  .put(authMiddleware, authUserMiddleware, removeFromCartUser);
router.route("/delete-cart-item-guest").put(removeFromCartGuest);
router
  .route("/get-cart-items-user")
  .get(authMiddleware, authUserMiddleware, getCartItemsUser);
router.route("/get-cart-items-guest").post(getCartItemsGuest);

export default router;
