import { CartUser } from "../models/Cart.js";
import { Product } from "../models/Product.js";

import {
  displayTotal,
  getNumOfProdInCart,
} from "../helpers/CartFuncHelpers.js";

//UPDATE CART USER

export const addToCartUser = async (req, res) => {
  const { cartItem } = req.body;

  try {
    const products = await Product.find();
    const product = await Product.findOne({ _id: cartItem._id });
    if (cartItem.quantity == 0) {
      return res.status(400).json({ errorMessage: "Quantity can't be zero" });
    } else if (cartItem.quantity > product.quantity) {
      return res.status(400).json({
        errorMessage: `Quantity can't be more than ${maxQuantity.quantity}`,
      });
    } else {
      Product.findOneAndUpdate(
        {
          _id: cartItem._id,
        },
        { $set: { quantity: product.quantity - cartItem.quantity } },
        function (err, result) {
          if (err) {
            return res.status(400).json({ errorMessage: `${err}` });
          }
        }
      );
    }
    const cart = await CartUser.findOne({ user: req.user._id });
    if (cart) {
      const alreadyInCart = cart.cartItems.find(
        (item) => item._id == cartItem._id
      );
      if (alreadyInCart) {
        CartUser.findOneAndUpdate(
          {
            user: req.user._id,
            "cartItems._id": cartItem._id,
          },
          {
            $set: {
              "cartItems.$.quantity":
                alreadyInCart.quantity + cartItem.quantity,
            },
          },
          function (err, result) {
            if (err) {
              return res.status(400).json({ errorMessage: `${err}` });
            } else {
              return res.status(200).json({
                prodAddedOrRemoved: cartItem.name,
                quantity: cartItem.quantity,
                added: true,
                hidden: false,
                updatedTime: cart.updatedAt,
              });
            }
          }
        );
      } else {
        cart.cartItems.push(cartItem);
        cart
          .save()
          .then((response) => {
            return res.status(200).json({
              prodAddedOrRemoved: cartItem.name,
              quantity: cartItem.quantity,
              added: true,
              hidden: false,
              updatedTime: cart.updatedAt,
            });
          })
          .catch((error) => {
            return res.status(400).json({ errorMessage: `${error}` });
          });
      }
    } else {
      const cart = new CartUser({
        user: req.user._id,
        cartItems: cartItem,
      });
      cart
        .save()
        .then((response) => {
          return res.status(200).json({
            prodAddedOrRemoved: cartItem.name,
            quantity: cartItem.quantity,
            added: true,
            hidden: false,
            updatedTime: cart.updatedAt,
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

//REMOVE FROM CART USER

export const removeFromCartUser = async (req, res) => {
  const { cartItem } = req.body;
  try {
    const cart = await CartUser.findOne({ user: req.user._id });
    if (cart) {
      const alreadyInCart = await cart.cartItems.find(
        (item) => item._id == cartItem._id
      );
      if (alreadyInCart) {
        const newCartList = cart.cartItems.filter(
          (item) => item._id != cartItem._id
        );
        if (newCartList.length == 0) {
          CartUser.deleteOne(
            {
              user: req.user._id,
            },
            function (err, result) {
              if (err) {
                console.log(err);
              }
            }
          );
        } else {
          cart.cartItems = newCartList;
          cart
            .save()
            .then((response) => console.log(response))
            .catch((err) => console.log(err));
        }

        const products = await Product.find();
        const product = products.find((item) => item._id == cartItem._id);
        Product.findOneAndUpdate(
          {
            _id: cartItem._id,
          },
          { $set: { quantity: product.quantity + cartItem.quantity } },
          function (err, result) {
            if (err) {
              console.log(err);
            } else {
              return res.status(200).json({
                updatedTime: cart.updatedAt,
              });
            }
          }
        );
      } else {
        return res
          .status(404)
          .json({ errorMessage: "Can't found item in cart" });
      }
    } else {
      return res.status(404).json({ errorMessage: "No items found in cart" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: `${error}` });
  }
};

//GET CART LIST USER

export const getCartItemsUser = async (req, res) => {
  try {
    const searchTerm = req.query.name;
    let sort = !req.query.sort ? -1 : req.query.sort;

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * pageSize;
    let totalCart = await CartUser.findOne({ user: req.user._id });

    if (totalCart) {
      const reducer = (previousValue, currentValue) =>
        previousValue + currentValue;

      let filter = {
        user: req.user._id,
        "cartItems.name": { $regex: searchTerm, $options: "i" },
      };

      let resultWithoutSortingAndLimiting = await CartUser.findOne(filter);

      if (
        resultWithoutSortingAndLimiting &&
        resultWithoutSortingAndLimiting.cartItems.length !== 0
      ) {
        let finalResult = await CartUser.aggregate([
          {
            $match: { user: req.user._id },
          },
          { $unwind: "$cartItems" },
          {
            $match: {
              "cartItems.name": { $regex: searchTerm, $options: "i" },
            },
          },
          {
            $sort: {
              "cartItems.updatedAt": sort == -1 ? -1 : 1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
          {
            $group: {
              _id: "$_id",
              user: {
                $first: "$user",
              },
              createdAt: {
                $first: "$createdAt",
              },
              updatedAt: {
                $first: "$updatedAt",
              },
              cartItems: {
                $push: "$cartItems",
              },
            },
          },
        ]);
        const pages = Math.ceil(
          resultWithoutSortingAndLimiting.cartItems.length / pageSize
        );

        if (finalResult[0].cartItems.length !== 0) {
          return res.status(200).json({
            cartList: finalResult[0].cartItems,
            count: getNumOfProdInCart(totalCart.cartItems),
            totalCart: totalCart,
            totalPrice: displayTotal(totalCart.cartItems),
            updatedTime: finalResult[0].updatedAt,
            page,
            pages,
          });
        } else {
          return res.status(404).json({ errorMessage: "No product found" });
        }
      } else {
        return res.status(404).json({ errorMessage: "No product found" });
      }
    } else {
      return res
        .status(200)
        .json({ cartList: [], count: 0, page: 1, pages: 1, totalCart: [] });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
