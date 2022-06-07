const path = require("path");
const { Product } = require("../models/product");
const { Category } = require("../models/category");

exports.addProduct = async (req, res) => {
  try {
    const file = req.file;
    // console.log("file===>", file);
    const { name, quantity, price, category } = JSON.parse(req.body.data);

    const categoryId = await Category.findOne({ name: category });
    if (!req.file) {
      return res
        .status(422)
        .send({ error: "pleas add an image for this product" });
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
    }).populate("creator category");

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

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
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
