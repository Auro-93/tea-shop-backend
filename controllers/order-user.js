import { Order } from "../models/Order.js";
import { CartUser } from "../models/Cart.js";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import cryptoRandomString from "crypto-random-string";

//LOADING ENVIRONMENT VARIABLE
dotenv.config();
const JWT_EMAIL_FROM = process.env.JWT_EMAIL_FROM;
const CLIENT_URL = process.env.CLIENT_URL;

export const addOrderUser = async (req, res, next) => {
  const { order, repeatOrder } = req.body;
  console.log(repeatOrder);
  //ORDER EMAIL DATA OBJECT
  const emailData = {
    from: JWT_EMAIL_FROM,
    to: req.user.email,
    subject: "Order successfully completed - Tea Store",
    html: `
            <h1>Hi ${req.user.username}! Thank you for your order</h1>
            <p>Tea Store has taken charge of your order.</p>
            <p>
            Check your  <a href = "${CLIENT_URL}/user/dashboard">
            User Profile </a> to stay updated on its status</p>
            <hr/>
            <p>${CLIENT_URL}</p>
        `,
  };
  try {
    const newOrder = new Order({
      orderId: cryptoRandomString({ length: 9 }),
      user: req.user._id,
      name: order.name,
      lastName: order.lastName,
      email: req.user.email,
      telephone: order.telephone,
      products: order.products,
      productsTotalPrice: order.productsTotalPrice,
      shipping: order.shipping,
      orderTotalPrice: order.orderTotalPrice,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      payment: order.payment,
    });

    if (repeatOrder) {
      newOrder
        .save()
        .then((response) => {
          sgMail
            .send(emailData)
            .then((response) => {
              console.log("sent");
              Order.find()
                .then((response) => {
                  req.orderList = response;
                  req.order = order;
                  next();
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    } else {
      newOrder
        .save()
        .then((response) => {
          CartUser.deleteMany({ user: req.user._id }, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Cart deleted after order");
              sgMail
                .send(emailData)
                .then((response) => {
                  console.log("sent");

                  return res.status(200).json({
                    successMessage:
                      "Thank you for your order! We are processing it. Check your mailbox for other info.",
                  });
                })

                .catch((error) => console.log(error));
            }
          });
        })
        .catch((error) => {
          return res.status(400).json({ errorMessage: `${error}` });
        });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

//GET USER ORDERS

export const getUserOrders = async (req, res) => {
  try {
    const orderStatus = req.query.status || "";
    const searchTerm = req.query.name;
    let sort = !req.query.sort ? -1 : req.query.sort;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * pageSize;

    //BUILD FILTER OBJECT
    let filter;
    if (!orderStatus) {
      filter = {
        user: req.user._id,
        "products.name": { $regex: searchTerm, $options: "i" },
      };
    } else {
      filter = {
        user: req.user._id,
        orderStatus: orderStatus,
        "products.name": { $regex: searchTerm, $options: "i" },
      };
    }

    let orders = await Order.find(filter);
    let totalOrders = await Order.find({ user: req.user._id });

    const total = orders.length;

    const pages = Math.ceil(total / pageSize);

    let result = await Order.find(filter)
      .sort({ createdAt: sort })
      .skip(skip)
      .limit(pageSize);

    if (result) {
      return res
        .status(200)
        .json({ orders: result, count: totalOrders.length, page, pages });
    } else {
      return res.status(404).json({ errorMessage: "User orders not found" });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
