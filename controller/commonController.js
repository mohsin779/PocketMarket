const { Category } = require("../models/category");
const { Product } = require("../models/product");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).send({ categories: categories });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate("category");
    res.status(200).send({ products: products });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
