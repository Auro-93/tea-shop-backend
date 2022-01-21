import dotenv from "dotenv";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

//LOADING ENVIRONMENT VARIABLE
dotenv.config();
const STRIPE_S_KEY = process.env.STRIPE_S_KEY;

//INITIALIZE STRIPE
const stripe = new Stripe(STRIPE_S_KEY);

export const handlePayment = (req, res) => {
  const { totalPrice, token } = req.body;
  console.log(totalPrice, token);
  const idempotencyKey = uuidv4();

  return stripe.customers
    .create({
      email: token.email,
      source: token.id,
    })
    .then((customer) => {
      stripe.charges.create(
        {
          amount: Math.round(totalPrice * 100),
          currency: "eur",
          customer: customer.id,
        },
        { idempotencyKey: idempotencyKey }
      );
    })
    .then((result) => {
      return res
        .status(200)
        .json({ successMessage: "Payment successfully done" });
    })
    .catch((err) => {
      return res.status(400).json({ errorMessage: "Payment failed" });
    });
};
