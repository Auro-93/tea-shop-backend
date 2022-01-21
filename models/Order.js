import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  streetAddress: {
    type: String,
    required: true,
  },
  postalCode: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    telephone: {
      type: String,
      required: true,
    },
    products: [
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
        image: {
          type: Object,
          required: true,
        },
      },
    ],
    productsTotalPrice: {
      type: Number,
      required: true,
    },
    shipping: {
      shippingMethod: {
        type: String,
        required: true,
      },
      shippingCost: {
        type: Number,
        required: true,
      },
    },
    orderTotalPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    payment: {
      payedAt: {
        type: Date,
        required: true,
      },
    },
    orderStatus: {
      type: String,
      default: "Processing",
    },
    deliveredAt: {
      type: Date,
    },
  },

  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
