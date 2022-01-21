import express from "express";
import { handlePayment } from "../stripe/stripe.js";

const router = express.Router();

router.route("/credit-card").post(handlePayment);

export default router;
