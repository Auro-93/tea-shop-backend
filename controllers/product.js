import { Product } from "../models/Product.js";
import { WishlistGuest } from "../models/Wishlist.js";
import { WishlistUser } from "../models/Wishlist.js";
import { CartGuest } from "../models/Cart.js";
import { CartUser } from "../models/Cart.js";

import slugify from "slugify";
import validator from "validator";

//GET PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const category = req.query.category;

    const searchTerm = req.query.name;

    let handleSortingOptions = () => {
      switch (req.query.sort) {
        case "DateDESC":
          return { createdAt: -1 };

          break;
        case "DateASC":
          return { createdAt: 1 };

          break;

        case "PriceASC":
          return { price: 1 };

          break;
        case "PriceDESC":
          return { price: -1 };

          break;

        default:
          return { date: -1 };

          break;
      }
    };

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * pageSize;

    let filter;
    if (!category) {
      filter = {
        name: { $regex: searchTerm, $options: "i" },
      };
    } else {
      filter = {
        "categories.name": category,
        name: { $regex: searchTerm, $options: "i" },
      };
    }

    const totalProducts = await Product.find();
    const products = await Product.find(filter);

    if (products.length !== 0) {
      const total = products.length;

      const pages = Math.ceil(total / pageSize);

      let result = await Product.find(filter)
        .sort(handleSortingOptions())
        .skip(skip)
        .limit(pageSize);

      if (result) {
        return res.status(200).json({
          products: result,
          count: totalProducts.length,
          totalProducts: totalProducts,
          page,
          pages,
        });
      } else {
        return res.status(404).json({ errorMessage: "Products not found" });
      }
    } else {
      return res.status(404).json({ errorMessage: "Products not found" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

//CREATE PRODUCT
export const createProduct = async (req, res) => {
  const { name, quantity, price, discount, description, category } = req.body;

  const image = req.file;

  console.log(category);

  let categories;

  categories = JSON.parse(category);

  console.log(categories);

  try {
    if (
      !name ||
      !quantity ||
      !price ||
      !description ||
      !image ||
      categories.length < 1
    ) {
      return res.status(400).json({
        errorMessage:
          'Fill in all required fields ( only "discount" is optional).',
      });
    }
    if (!validator.isLength(name, { max: 30 })) {
      return res
        .status(400)
        .json({ errorMessage: "Product name must be less than 31 characters" });
    }
    if (!validator.isLength(description, { max: 500 })) {
      return res.status(400).json({
        errorMessage: "Product description must be less than 501 characters",
      });
    }
    if (req.fileValidationError) {
      return res.status(422).json({ errorMessage: req.fileValidator });
    }

    const product = await Product.findOne({ name });

    if (product) {
      return res.status(409).json({ errorMessage: "Product already exist." });
    }

    const newProduct = new Product({
      name,
      slug: slugify(name),
      description,
      image,
      price,
      discount,
      quantity,
      categories: categories,
    });

    newProduct.save((err, saved) => {
      if (err) {
        return res.status(400).json({ errorMessage: err.message });
      }
      if (saved) {
        return res
          .status(201)
          .json({ successMessage: "Product created successfully!" });
      }
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

//EDIT PRODUCT
export const editProduct = async (req, res) => {
  const {
    name,
    quantity,
    price,
    discount,
    description,
    category,
    id,
    originalImg,
  } = req.body;

  const image = req.file;

  let categories;

  categories = JSON.parse(category);

  try {
    if (
      !name ||
      !quantity ||
      !price ||
      !description ||
      !image ||
      categories.length < 1
    ) {
      return res.status(400).json({
        errorMessage:
          'Fill in all required fields ( only "discount" is optional).',
      });
    }
    if (!validator.isLength(name, { max: 30 })) {
      return res
        .status(400)
        .json({ errorMessage: "Product name must be less than 31 characters" });
    }
    if (!validator.isLength(description, { max: 500 })) {
      return res.status(400).json({
        errorMessage: "Product description must be less than 501 characters",
      });
    }
    if (req.fileValidationError) {
      return res.status(422).json({ errorMessage: req.fileValidator });
    }

    const productToBeEdited = await Product.findOne({ _id: id });

    if (productToBeEdited) {
      const editedProd = await Product.findOneAndUpdate(
        {
          _id: id,
        },
        {
          $set: {
            _id: id,
            name: name,
            slug: slugify(name),
            description: description,
            image: image,
            price: price,
            discount: discount,
            quantity: quantity,
            categories: categories,
          },
        }
      );

      let editedProdInWGuest;
      let editedProdInWUser;
      let editedProdInCGuest;
      let editedProdInCUser;

      const foundProdInWishlistGuest = await WishlistGuest.find({
        "wishlistItems._id": id,
      });

      if (foundProdInWishlistGuest) {
        editedProdInWGuest = await WishlistGuest.updateMany(
          { "wishlistItems._id": id },
          {
            $set: {
              "wishlistItems.$._id": id,
              "wishlistItems.$.name": name,
              "wishlistItems.$.slug": slugify(name),
              "wishlistItems.$.image": image,
              "wishlistItems.$.price": price,
              "wishlistItems.$.discount": discount,
            },
          }
        );
      }

      const foundProdInWishlistUser = await WishlistUser.find({
        "wishlistItems._id": id,
      });

      if (foundProdInWishlistUser) {
        editedProdInWUser = await WishlistUser.updateMany(
          { "wishlistItems._id": id },
          {
            $set: {
              "wishlistItems.$._id": id,
              "wishlistItems.$.name": name,
              "wishlistItems.$.slug": slugify(name),
              "wishlistItems.$.image": image,
              "wishlistItems.$.price": price,
              "wishlistItems.$.discount": discount,
            },
          }
        );
      }

      const foundProdInCartUser = await CartUser.find({
        "cartItems._id": id,
      });

      if (foundProdInCartUser) {
        editedProdInCUser = await CartUser.updateMany(
          { "cartItems._id": id },
          {
            $set: {
              "cartItems.$._id": id,
              "cartItems.$.name": name,
              "cartItems.$.slug": slugify(name),
              "cartItems.$.image": image,
              "cartItems.$.price": price,
              "cartItems.$.discount": discount,
            },
          }
        );
      }

      const foundProdInCartGuest = await CartGuest.find({
        "cartItems._id": id,
      });

      if (foundProdInCartGuest) {
        editedProdInCGuest = await CartGuest.updateMany(
          { "cartItems._id": id },
          {
            $set: {
              "cartItems.$._id": id,
              "cartItems.$.name": name,
              "cartItems.$.slug": slugify(name),
              "cartItems.$.image": image,
              "cartItems.$.price": price,
              "cartItems.$.discount": discount,
            },
          }
        );
      }
      if (editedProd) {
        return res
          .status(200)
          .json({ successMessage: "Product successfull edited!" });
      }
    } else {
      return res.status(404).json({ errorMessage: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

//DELETE PRODUCT

export const deleteProduct = async (req, res) => {
  const { prodId, prodImg } = req.body;

  try {
    const foundProd = await Product.findById({ _id: prodId });
    if (foundProd) {
      const deletedProd = await Product.deleteOne({ _id: prodId });

      let deletedProdInWGuest;
      let deletedProdInWUser;
      let deletedProdInCGuest;
      let deletedProdInCUser;
      const foundProdInWishlistGuest = await WishlistGuest.find({
        "wishlistItems._id": prodId,
      });

      if (foundProdInWishlistGuest) {
        deletedProdInWGuest = await WishlistGuest.updateMany(
          { "wishlistItems._id": prodId },
          { $pull: { wishlistItems: { _id: prodId } } }
        );
      }
      const foundProdInWishlistUser = await WishlistUser.find({
        "wishlistItems._id": prodId,
      });
      if (foundProdInWishlistUser) {
        deletedProdInWUser = await WishlistUser.updateMany(
          { "wishlistItems._id": prodId },
          { $pull: { wishlistItems: { _id: prodId } } }
        );
      }
      const foundProdInCartUser = await CartUser.find({
        "cartItems._id": prodId,
      });
      if (foundProdInCartUser) {
        deletedProdInCUser = await CartUser.updateMany(
          { "cartItems._id": prodId },
          { $pull: { cartItems: { _id: prodId } } }
        );
      }
      const foundProdInCartGuest = await CartGuest.find({
        "cartItems._id": prodId,
      });
      if (foundProdInCartGuest) {
        deletedProdInCGuest = await CartGuest.updateMany(
          { "cartItems._id": prodId },
          { $pull: { cartItems: { _id: prodId } } }
        );
      }

      if (
        deletedProd &&
        !foundProdInWishlistGuest &&
        !foundProdInCartGuest &&
        !foundProdInWishlistUser &&
        !foundProdInCartUser
      ) {
        return res
          .status(200)
          .json({ successMessage: "Product successfull removed!" });
      }

      if (
        deletedProd &&
        (deletedProdInCGuest ||
          deletedProdInCUser ||
          deletedProdInWGuest ||
          deletedProdInWUser)
      ) {
        return res
          .status(200)
          .json({ successMessage: "Product successfull removed!" });
      }
    } else {
      return res.status(404).json({ errorMessage: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};
