import { Product } from "../models/Product.js";

export const decreaseProdStock = async (req, res) => {
  try {
    let promises = [];

    promises.push(
      req.order.products.map((prod) => {
        Product.findOneAndUpdate(
          {
            _id: prod._id,
          },
          { $inc: { quantity: -prod.quantity } },
          function (err, response) {
            if (err) {
              console.log(err);
            } else {
              console.log(response.quantity);
            }
          }
        );
      })
    );

    Promise.all(promises)
      .then((response) => {
        return res.status(200).json({
          order: req.orderList,
          successMessage:
            "Thank you for your order! We are processing it. Check your mailbox for other info.",
        });
      })
      .catch((error) => {
        return res.status(400).json({ errorMessage: `${error}` });
      });
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
