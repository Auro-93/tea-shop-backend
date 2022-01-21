import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    image: {
      type: Object,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CartUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [CartSchema],
  },
  { timestamps: true }
);

const CartGuestSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    cartItems: [CartSchema],
  },
  { timestamps: true }
);

export const CartUser = mongoose.model("CartUser", CartUserSchema);
export const CartGuest = mongoose.model("CartGuest", CartGuestSchema);
