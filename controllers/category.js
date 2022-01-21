import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import slugify from "slugify";
import validator from "validator";

//HELPERS
const nestingCategories = (categories, parentId = null) => {
  const catList = [];
  let category;
  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }

  for (let cat of category) {
    catList.push({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      children: nestingCategories(categories, cat._id),
    });
  }

  return catList;
};

//GET CATEGORIES
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    if (!categories) {
      return res.status(404).json({ errorMessage: "No categories found." });
    }

    //GET ONLY NOT EMPTY CATEGORIES

    let notEmptyCat = [];

    await Promise.all(
      categories.map(async (category) => {
        const catInProd = await Product.findOne({
          "categories.name": category.name,
        });
        if (catInProd) {
          notEmptyCat.push(category);
        }
      })
    );

    const catList = nestingCategories(categories);
    const notEmptyCatList = nestingCategories(notEmptyCat);

    return res.status(200).json({
      catList: catList,
      notEmptyCatList: notEmptyCatList,
      count: categories.length,
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

//CREATE CATEGORY
export const createCategory = async (req, res) => {
  const { name, parentId } = req.body;

  try {
    if (!name) {
      return res
        .status(400)
        .json({ errorMessage: "Category name field is required." });
    }
    if (!validator.isLength(name, { max: 30 })) {
      return res.status(400).json({
        errorMessage: "Category name must be less than 30 characters",
      });
    }

    const category = await Category.findOne({ name });

    if (category) {
      return res.status(409).json({ errorMessage: "Category already exist." });
    }

    let id;

    if (parentId) {
      const findParentId = await Category.findOne({ name: parentId });
      if (findParentId) {
        id = findParentId._id;
      }
    }

    const newCategory = new Category({
      name,
      slug: slugify(name),
      parentId: id,
    });
    newCategory.save((err, saved) => {
      if (err) {
        return res.status(400).json({ errorMessage: err.message });
      }
      if (saved) {
        return res
          .status(201)
          .json({ successMessage: "Category created successfully!" });
      }
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

//EDIT CATEGORY

export const editCategory = async (req, res) => {
  const { categoryName, categoryId } = req.body;

  try {
    const foundCategory = await Category.findById({ _id: categoryId });
    if (foundCategory) {
      const editedCategory = await Category.findOneAndUpdate(
        { _id: categoryId },
        { $set: { name: categoryName, slug: slugify(categoryName) } }
      );

      const foundInCategoryProducts = await Product.find({
        "categories._id": categoryId,
      });
      if (foundInCategoryProducts) {
        Product.updateMany(
          { "categories._id": categoryId },
          {
            $set: {
              "categories.$.name": categoryName,
              "categories.$.slug": slugify(categoryName),
            },
          },
          (err, result) => {
            console.log("");
          }
        );
      }

      if (editedCategory) {
        return res
          .status(200)
          .json({ successMessage: "Category successfull edited!" });
      }
    } else {
      return res.status(404).json({ errorMessage: "Category not found" });
    }
  } catch (error) {}
};

//REMOVE CATEGORY

export const removeCategory = async (req, res) => {
  const { categoryId } = req.body;

  try {
    const foundCategory = await Category.findById({ _id: categoryId });
    if (foundCategory) {
      const deletedCat = await Category.deleteOne({ _id: categoryId });
      const subCategory = await Category.find({ parentId: categoryId });
      let deletedSubCat;
      if (subCategory) {
        deletedSubCat = await Category.deleteMany({
          parentId: categoryId,
        });
      }
      const deletProductsInCategory = await Product.deleteMany({
        "categories._id": categoryId,
      });
      if ((deletedCat || deletedSubCat) && deletProductsInCategory) {
        return res
          .status(200)
          .json({ successMessage: "Category deleted succesfully!" });
      }
    } else {
      return res.status(404).json({ errorMessage: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};
