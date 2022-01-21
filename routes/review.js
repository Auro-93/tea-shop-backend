import express from "express";
import { authMiddleware, authUserMiddleware } from "../middlewares/auth.js";
import {
  getProductReviews,
  getUserReview,
  addReview,
  removeReview,
} from "../controllers/review.js";

const router = express.Router();

router.route("/get-product-reviews").get(getProductReviews);
router
  .route("/get-user-reviews")
  .get(authMiddleware, authUserMiddleware, getUserReview);
router
  .route("/add-user-review")
  .post(authMiddleware, authUserMiddleware, addReview);
router
  .route("/remove-user-review")
  .put(authMiddleware, authUserMiddleware, removeReview);

export default router;
