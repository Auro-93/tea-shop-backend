import express from "express";
import { authMiddleware, authAdminMiddleware } from "../middlewares/auth.js";
import {
  getProducts,
  createProduct,
  editProduct,
  deleteProduct,
} from "../controllers/product.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

router.route("/get-products").get(getProducts);

router
  .route("/create-product")
  .post(
    authMiddleware,
    authAdminMiddleware,
    upload.single("image"),
    createProduct
  );
router
  .route("/edit-product")
  .put(
    authMiddleware,
    authAdminMiddleware,
    upload.single("image"),
    editProduct
  );
router
  .route("/delete-product")
  .put(authMiddleware, authAdminMiddleware, deleteProduct);

export default router;
