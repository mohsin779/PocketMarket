const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const { StatusCodes } = require("http-status-codes");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const { Shop } = require("../models/shop");
const { UpdateRequest } = require("../models/updateRequests");
const { OrderedProduct } = require("../models/orderedProduct");
const { Order } = require("../models/order");

exports.myShop = async (req, res, next) => {
  const shopId = req.user._id;
  const shop = await Shop.findById(shopId);
  try {
    if (!shop) {
      return res.status(404).send("Could not find Shop");
    }
    res.status(200).json({ shop: shop });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.myProducts = async (req, res, next) => {
  try {
    const shopId = req.user._id;
    const products = await Product.find({ creator: shopId });
    if (!products) {
      return res.json({ error: "You dont have any product" });
    }
    return res.json({ products: products });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateShop = async (req, res, next) => {
  try {
    const shopId = req.user._id;
    const { name, email, password } = req.body;
    let pass = password;
    if (password) {
      const hashedPw = await bcrypt.hash(password, 12);
      pass = hashedPw;
    }

    const updateRequest = new UpdateRequest({
      shopId: shopId,
      name: name,
      email: email,
      password: pass,
    });

    await updateRequest.save();
    res
      .status(200)
      .json({ message: "Request sent Successfully to SuperAdmin" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addProduct = async (req, res) => {
  try {
    const file = req.file;

    const { name, quantity, sellingPrice, category, retailPrice, description } =
      req.body;
    if (!req.file) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: "please add an image for this product" });
    }
    let imagePath = await cloudinary.uploader.upload(file.path);

    const product = new Product({
      name: name,
      quantity: quantity,
      sellingPrice: sellingPrice,
      retailPrice: retailPrice,
      description: description,
      imageUrl: imagePath.secure_url,
      creator: req.user._id,
      category: category,
    });
    await product.save();
    clearImage(file.path);
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

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { name, quantity, sellingPrice, category, retailPrice, description } =
      req.body;

    let imageUrl;
    if (req.file) {
      let imagePath = await cloudinary.uploader.upload(req.file.path);
      imageUrl = imagePath.secure_url;
      clearImage(req.file.path);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send({ error: "Could not find product" });
    }
    if (product.creator.toString() !== req.user._id) {
      return res.status(403).send({ error: "Not authorized!" });
    }
    if (imageUrl && imageUrl !== product.imageUrl) {
      var filename = product.imageUrl.split("/").pop();
      filename = filename.split(".")[0];
      cloudinary.uploader.destroy(filename);
    }
    product.name = name;
    product.quantity = quantity;
    product.sellingPrice = sellingPrice;
    product.retailPrice = retailPrice;
    product.description = description;
    if (imageUrl) {
      product.imageUrl = imageUrl;
    }
    product.category = category;

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
    var filename = product.imageUrl.split("/").pop();
    filename = filename.split(".")[0];
    console.log(filename);
    cloudinary.uploader.destroy(filename);
    await Product.findByIdAndRemove(productId);

    res.status(200).json({ message: "Deleted product." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.orders = async (req, res, next) => {
  try {
    const shopId = req.user._id;
    const order = await OrderedProduct.find({ shopId: shopId });
    if (!order) {
      return res.json({ error: "You dont have any order" });
    }
    return res.json({ order: order });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const shop = await OrderedProduct.findOne({ orderId: orderId });

    if (shop.shopId.toString() !== req.user._id) {
      return res.status(401).send({ error: "Not Authanticted" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ error: "order not found" });
    }
    order.status = "delivered";
    await order.save();
    return res.json({ message: "Staus updated successfully!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
