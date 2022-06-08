const path = require("path");
const fs = require("fs");
const { StatusCodes } = require("http-status-codes");
const { Product } = require("../models/product");
const { Category } = require("../models/category");

const { resolveSoa } = require("dns");

exports.addProduct = async (req, res) => {
  try {
    console.log("before");
    const file = req.file;
    console.log("after");
    // console.log("file===>", file);
    // const { name, quantity, price, category } = JSON.parse(req.body.data);
    const { name, quantity, price, category } = req.body;

    const categoryId = await Category.findOne({ name: category });
    if (!req.file) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: "please add an image for this product" });
    }

    const product = new Product({
      name: name,
      quantity: quantity,
      price: price,
      imageUrl: file.path,
      creator: req.user._id,
      category: categoryId,
    });
    await product.save();

    const createdProduct = await Product.findById({
      _id: product._id,
    }).populate("category");

    res.status(201).json({
      message: "Product created!",
      product: createdProduct,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getProduct = async (req, res, next) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId);
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

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { name, quantity, price, category } = req.body;

    const categoryId = await Category.findOne({ name: category });

    let imageUrl;
    if (req.file) {
      imageUrl = req.file.path;
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send({ error: "Could not find product" });
    }
    if (product.creator.toString() !== req.user._id) {
      return res.status(403).send({ error: "Not authorized!" });
    }
    if (imageUrl && imageUrl !== product.imageUrl) {
      clearImage(product.imageUrl);
    }
    product.name = name;
    product.quantity = quantity;
    product.price = price;
    if (imageUrl) {
      product.imageUrl = imageUrl;
    }
    product.category = categoryId;

    const result = await product.save();
    res.status(200).json({ message: "Product updated!", product: result });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Could not find product");
    }
    if (product.creator.toString() !== req.user._id) {
      return res.status(403).send("Not authorized!");
    }
    clearImage(product.imageUrl);
    await Product.findByIdAndRemove(productId);

    res.status(200).json({ message: "Deleted product." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

// exports.getMyProducts = async (req, res, next) => {
//   //   console.log(req.user._id);
//   try {
//     const products = await Product.find(creator._id: req.user._id).populate(
//       "category"
//     );
//     res.status(200).send({ products: products });
//   } catch (err) {
//     res.status(500).send({ error: err });
//   }
// };
