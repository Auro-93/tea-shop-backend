import mongoose from "mongoose";

const ReviewArrSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      required: true,
    },
    reviewUsername: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSlug: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviews: [ReviewArrSchema],
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", ReviewSchema);
