import { Order } from "../models/Order.js";
import { CartGuest } from "../models/Cart.js";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import cryptoRandomString from "crypto-random-string";

//LOADING ENVIRONMENT VARIABLE
dotenv.config();
const JWT_EMAIL_FROM = process.env.JWT_EMAIL_FROM;
const CLIENT_URL = process.env.CLIENT_URL;

export const addOrderGuest = async (req, res) => {
  //ORDER EMAIL DATA OBJECT
  const emailData = {
    from: JWT_EMAIL_FROM,
    to: req.user.email,
    subject: "Order successfully completed - Tea Store",
    html: `
            <h1>Hi ${req.user.username}! Thank you for your order</h1>
            <p>Tea Store has taken charge of your order.</p>
            <p>
            We have also created your new account. <a href = "${CLIENT_URL}/sign-in">
            Log in </a> to stay updated on its status</p>
            <hr/>
            <p>${CLIENT_URL}</p>
        `,
  };
  try {
    const order = new Order({
      orderId: cryptoRandomString({ length: 9 }),
      user: req.user._id,
      name: req.order.name,
      lastName: req.order.lastName,
      email: req.user.email,
      telephone: req.order.telephone,
      products: req.order.products,
      productsTotalPrice: req.order.productsTotalPrice,
      shipping: req.order.shipping,
      orderTotalPrice: req.order.orderTotalPrice,
      shippingAddress: req.order.shippingAddress,
      billingAddress: req.order.billingAddress,
      payment: req.order.payment,
    });

    order
      .save()
      .then((response) => {
        CartGuest.deleteMany(
          { sessionId: req.order.sessionId },
          function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Cart deleted after order");
              sgMail
                .send(emailData)
                .then((response) => {
                  console.log("sent");
                  Order.find()
                    .then((response) => {
                      return res.status(200).json({
                        successMessage:
                          "Thank you for your order! We are processing it. Check your mailbox for other info.",
                      });
                    })
                    .catch((error) => console.log(error));
                })
                .catch((error) => {
                  return res.json({ errorMessage: `${err}` });
                });
            }
          }
        );
      })
      .catch((error) => {
        return res.status(400).json({ errorMessage: `${error}` });
      });
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
