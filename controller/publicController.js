const { Category } = require("../models/category");
const { Product } = require("../models/product");
const { Shop } = require("../models/shop");

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

exports.getShop = async (req, res, next) => {
  const shopId = req.params.shopId;
  const shop = await Shop.findById(shopId).select("-password -role");
  try {
    if (!shop) {
      return res.status(404).send("Could not find Shop");
    }
    res.status(200).json({ message: "Shop fetched.", shop: shop });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId).select("-retailPrice");
  try {
    if (!product) {
      return res.status(404).send({ error: "Could not find Product." });
    }
    res.status(200).json({ message: "Product fetched.", product: product });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
