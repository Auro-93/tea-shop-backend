import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import categoryRouter from "./routes/category.js";
import productRouter from "./routes/product.js";
import wishlistRouter from "./routes/wishlist.js";
import cartRouter from "./routes/cart.js";
import paymentRouter from "./routes/stripe.js";
import orderRouter from "./routes/order.js";
import contactUsRouter from "./routes/contact-us.js";
import reviewsRouter from "./routes/review.js";
import cron from "node-cron";
import { clearCartGuest, clearCartUser } from "./cron-jobs/ClearCart.js";

//DOTENV CONFIG
dotenv.config();
const CLIENT_URL = process.env.CLIENT_URL;
const MONGODB_CONNECTION = process.env.MONGO_URI;

//INITIALIZE APP
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: `${CLIENT_URL}`,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

//ROUTES

app.use("/api/auth", authRouter);
app.use("/api/user/wishlist", wishlistRouter);
app.use("/api/user/cart", cartRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/order", orderRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api", contactUsRouter);
app.use("/api/uploads", express.static("uploads"));

//PORT
const PORT = process.env.PORT || 5020;

//CONNECT MONGODB
const connectDB = () => {
  mongoose
    .connect(MONGODB_CONNECTION, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(
      //INITIALIZE SERVER
      app.listen(PORT, () =>
        console.log(
          `Connection is established and running on port ${PORT} and MONGODB is connected`
        )
      )
    )
    .catch((err) => console.log("MONGODB connection error:", err));
};

connectDB();

//CRON JOBS

cron.schedule("* * * * * *", clearCartGuest);
cron.schedule("* * * * * *", clearCartUser);
