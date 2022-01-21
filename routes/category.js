import express from "express";
import {
  getCategories,
  createCategory,
  removeCategory,
  editCategory,
} from "../controllers/category.js";
import { authMiddleware, authAdminMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.route("/get-categories").get(getCategories);
router
  .route("/create-category")
  .post(authMiddleware, authAdminMiddleware, createCategory);
router
  .route("/remove-category")
  .put(authMiddleware, authAdminMiddleware, removeCategory);
router
  .route("/edit-category")
  .put(authMiddleware, authAdminMiddleware, editCategory);

export default router;
