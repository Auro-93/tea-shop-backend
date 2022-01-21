import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
    },
    date: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);

const WishListUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wishlistItems: [WishlistSchema],
  },
  { timestamps: true }
);

const WishListGuestSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    wishlistItems: [WishlistSchema],
  },
  { timestamps: true }
);

export const WishlistUser = mongoose.model("WishlistUser", WishListUserSchema);
export const WishlistGuest = mongoose.model(
  "WishlistGuest",
  WishListGuestSchema
);
