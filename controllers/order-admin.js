import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

//LOADING ENVIRONMENT VARIABLE
dotenv.config();
const JWT_EMAIL_FROM = process.env.JWT_EMAIL_FROM;
const CLIENT_URL = process.env.CLIENT_URL;

// GET ALL ORDERS IN DB

export const getAllOrders = async (req, res) => {
  try {
    const orderStatus = req.query.status || "";
    const searchTerm = req.query.id;
    let sort = !req.query.sort ? -1 : req.query.sort;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * pageSize;

    //BUILD FILTER OBJECT
    let filter;
    if (!orderStatus) {
      filter = {
        orderId: { $regex: searchTerm },
      };
    } else {
      filter = {
        orderStatus: orderStatus,
        orderId: { $regex: searchTerm },
      };
    }

    let orders = await Order.find(filter);

    const total = orders.length;

    const pages = Math.ceil(total / pageSize);
    console.log(total);

    let totalOrders = await Order.find();

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

// UPDATE ORDER STATUS

export const updateOrderStatus = async (req, res) => {
  const { object_id, order_id, order_status, order_email } = req.body;

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * pageSize;

  // email data object

  let html;
  let subject;
  if (order_status === "Processing") {
    subject = `We are processing your order - Tea Store`;
    html = `<p>Your order ${order_id} is being processed!</p> 
    <p>Check your email for updates. </p>
    <hr/>
    <p>${CLIENT_URL}</p>
    `;
  } else if (order_status === "Processed") {
    subject = `Your order has been processed - Tea Store`;
    html = `<p>Your order ${order_id} has been successfully processed!</p> 
    <p>Check your email for updates. </p>
    <hr/>
    <p>${CLIENT_URL}</p>
    `;
  } else if (order_status === "Shipped") {
    subject = `Your order has been shipped - Tea Store`;
    html = `<p>Your order ${order_id} has been shipped!</p> 
    <p>The package will arrive within approximately 3-5 working days (times may be longer for orders from abroad).</p>
    <hr/>
    <p>${CLIENT_URL}</p>
    `;
  } else if (order_status === "Received") {
    subject = `Your order has been received - Tea Store`;
    html = `<p>Your order ${order_id} has been received!</p> 
    <p>
    Thank you for choosing Tea Store!</p>
    <p>You can leave a review on the products purchased on our site at any time.</p>
    <hr/>
    <p>${CLIENT_URL}</p>
    `;
  }
  const emailData = {
    from: JWT_EMAIL_FROM,
    to: order_email,
    subject: subject,
    html: html,
  };

  try {
    if (!order_status) {
      return res.status(400).json({ errorMessage: "Order status is required" });
    } else {
      Order.findOneAndUpdate(
        {
          _id: object_id,
        },
        { $set: { orderStatus: order_status } },
        async (err, result) => {
          if (err) {
            return res.status(400).json({ errorMessage: `${err}` });
          }
          if (result) {
            let orders = await Order.find();

            const total = orders.length;
            const pages = Math.ceil(total / pageSize);

            let result = await Order.find().skip(skip).limit(pageSize);

            sgMail
              .send(emailData)
              .then((response) => {
                return res.status(200).json({ orders: result, pages, page });
              })
              .catch((error) => console.log(error));
          }
        }
      );
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

// GET ALL CUSTOMERS

export const getAllCustomers = async (req, res) => {
  try {
    let customersArr = [];
    const users = await User.find();
    if (users) {
      await Promise.all(
        users.map(async (user) => {
          const customer = await Order.findOne({ user: user._id });
          if (customer) {
            customersArr.push(customer.user);
          }
        })
      );
      return res.status(200).json({ customers: customersArr.length });
    } else {
      return res.status(404).json({ errorMessage: "No customers found" });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

//GET NUMBER OF ALL PRODUCT SALED

export const getNumOfProdSaled = async (req, res) => {
  try {
    let sumArr = [];
    const orders = await Order.find();
    if (orders) {
      orders.forEach((order) => {
        order.products.forEach((prod) => {
          sumArr.push(prod.quantity);
        });
      });
      const reducer = (previousValue, currentValue) =>
        previousValue + currentValue;
      return res.status(200).json({ prodSaled: sumArr.reduce(reducer, 0) });
    } else {
      res.status(404).json({ errorMessage: "No product saled" });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

//GET TOTAL INCOME FROM ORDERS

export const getTotalIncome = async (req, res) => {
  try {
    let sumArr = [];
    const orders = await Order.find();
    if (orders) {
      orders.forEach((el) => {
        sumArr.push(el.productsTotalPrice);
      });
      const reducer = (previousValue, currentValue) =>
        previousValue + currentValue;

      return res.status(200).json({
        totalIncome: sumArr.reduce(reducer, 0),
      });
    } else {
      return res.status(200).json({ errorMessage: "No income" });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
