import express from "express";
import { orderSignUp } from "../middlewares/orderSignUp.js";
import {
  authMiddleware,
  authUserMiddleware,
  authAdminMiddleware,
} from "../middlewares/auth.js";
import { decreaseProdStock } from "../middlewares/decreaseProdStock.js";
import { addOrderGuest } from "../controllers/order-guest.js";
import { addOrderUser, getUserOrders } from "../controllers/order-user.js";
import {
  getAllOrders,
  updateOrderStatus,
  getAllCustomers,
  getTotalIncome,
  getNumOfProdSaled,
} from "../controllers/order-admin.js";
import { checkOrderFields } from "../middlewares/checkOrderFields.js";

const router = express.Router();

router
  .route("/add-order-guest")
  .post(orderSignUp, checkOrderFields, addOrderGuest);
router
  .route("/add-order-user")
  .post(authMiddleware, authUserMiddleware, addOrderUser, decreaseProdStock);
router
  .route("/get-user-orders")
  .get(authMiddleware, authUserMiddleware, getUserOrders);
router
  .route("/get-all-orders")
  .get(authMiddleware, authAdminMiddleware, getAllOrders);
router
  .route("/update-order-status")
  .put(authMiddleware, authAdminMiddleware, updateOrderStatus);
router
  .route("/get-all-customers")
  .get(authMiddleware, authAdminMiddleware, getAllCustomers);
router
  .route("/get-prod-saled")
  .get(authMiddleware, authAdminMiddleware, getNumOfProdSaled);
router
  .route("/get-total-income")
  .get(authMiddleware, authAdminMiddleware, getTotalIncome);

export default router;
