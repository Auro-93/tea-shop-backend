import express from "express";
import { contactUs } from "../controllers/contact-us.js";

const router = express.Router();

router.route("/contact-us").post(contactUs);

export default router;
