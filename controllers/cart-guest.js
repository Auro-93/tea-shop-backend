import { v4 as uuidv4 } from "uuid";
import { CartGuest } from "../models/Cart.js";
import { Product } from "../models/Product.js";

import {
  displayTotal,
  getNumOfProdInCart,
} from "../helpers/CartFuncHelpers.js";

//UPDATE CART GUEST

export const addToCartGuest = async (req, res) => {
  const { cartItem, sessionId } = req.body;

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
    const cart = await CartGuest.findOne({ sessionId: sessionId });
    if (cart) {
      const alreadyInCart = cart.cartItems.find(
        (item) => item._id == cartItem._id
      );
      if (alreadyInCart) {
        CartGuest.findOneAndUpdate(
          {
            sessionId: sessionId,
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
      const cart = new CartGuest({
        sessionId: uuidv4(),
        cartItems: cartItem,
      });
      cart
        .save()
        .then((response) => {
          console.log(cart);
          return res.status(200).json({
            prodAddedOrRemoved: cartItem.name,
            quantity: cartItem.quantity,
            added: true,
            hidden: false,
            updatedTime: cart.updatedAt,
            sessionId: cart.sessionId,
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

//REMOVE FROM CART GUEST

export const removeFromCartGuest = async (req, res) => {
  const { cartItem, sessionId } = req.body;

  try {
    const cart = await CartGuest.findOne({ sessionId: sessionId });
    if (cart) {
      const alreadyInCart = await cart.cartItems.find(
        (item) => item._id == cartItem._id
      );
      if (alreadyInCart) {
        const newCartList = cart.cartItems.filter(
          (item) => item._id != cartItem._id
        );
        if (newCartList.length == 0) {
          CartGuest.deleteOne(
            {
              sessionId: sessionId,
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

//GET CART LIST GUEST

export const getCartItemsGuest = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const searchTerm = req.query.name;
    let sort = !req.query.sort ? -1 : req.query.sort;

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * pageSize;
    let totalCart = await CartGuest.findOne({ sessionId: sessionId });
    if (totalCart) {
      let filter = {
        sessionId: sessionId,
        "cartItems.name": { $regex: searchTerm, $options: "i" },
      };

      let resultWithoutSortingAndLimiting = await CartGuest.findOne(filter);

      if (
        resultWithoutSortingAndLimiting &&
        resultWithoutSortingAndLimiting.cartItems.length !== 0
      ) {
        let finalResult = await CartGuest.aggregate([
          {
            $match: { sessionId: sessionId },
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
              sessionId: {
                $first: "$sessionId",
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
