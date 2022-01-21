import { CartUser, CartGuest } from "../models/Cart.js";
import { Product } from "../models/Product.js";

/*CLEAR CART AFTER 1 HOUR IF NOT CHECKOUT */

/*CLEAR CART USER*/

export const clearCartUser = () => {
  CartUser.find()
    .then((cart) => {
      if (cart.length > 0) {
        cart.forEach((c) => {
          const updatedTime = new Date(c.updatedAt).getTime();
          const thisTime = new Date().getTime();
          const total = thisTime - updatedTime;
          const hours = Math.floor(total / 1000) / 3600;
          console.log(hours);
          if (hours == 1 || hours > 1) {
            c.cartItems.forEach((el) => {
              Product.findOne({ _id: el._id }).then((product) => {
                Product.findOneAndUpdate(
                  {
                    _id: el._id,
                  },
                  { $set: { quantity: product.quantity + el.quantity } },
                  function (err, result) {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
              });
            });
            c.remove(function (err, result) {
              if (err) {
                console.log(err);
              }
              if (result) {
                /*console.log("cart removed")*/
              }
            });
          }
        });
      } else {
        /*console.log("No items in cart")*/
      }
    })
    .catch((err) => console.log(err));
};

/*CLEAR CART GUEST*/

export const clearCartGuest = () => {
  CartGuest.find()
    .then((cart) => {
      if (cart.length > 0) {
        cart.forEach((c) => {
          const updatedTime = new Date(c.updatedAt).getTime();
          const thisTime = new Date().getTime();
          const total = thisTime - updatedTime;
          const hours = Math.floor(total / 1000) / 3600;
          console.log(hours);
          if (hours == 1 || hours > 1) {
            c.cartItems.forEach((el) => {
              Product.findOne({ _id: el._id }).then((product) => {
                Product.findOneAndUpdate(
                  {
                    _id: el._id,
                  },
                  { $set: { quantity: product.quantity + el.quantity } },
                  function (err, result) {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
              });
            });
            c.remove(function (err, result) {
              if (err) {
                console.log(err);
              }
              if (result) {
                /*console.log("cart removed")*/
              }
            });
          }
        });
      } else {
        /*console.log("No items in cart")*/
      }
    })
    .catch((err) => console.log(err));
};
