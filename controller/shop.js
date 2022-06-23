const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const XLSX = require("xlsx");

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
    const products = await Product.find({ creator: shopId }).populate(
      "category"
    );
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

exports.getProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).populate("category");
    if (req.user._id.toString() !== product.creator.toString()) {
      return res.status(401).send({ error: "Not Authorized" });
    }
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

    const {
      name,
      quantity,
      sellingPrice,
      category,
      retailPrice,
      description,
      brandName,
      features,
    } = req.body;

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
      brandName: brandName,
      features: features,
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
    const {
      name,
      quantity,
      sellingPrice,
      category,
      retailPrice,
      description,
      brandName,
      features,
    } = req.body;

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
    product.brandName = brandName;
    product.features = features;
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

exports.uploadProducts = async (req, res, next) => {
  try {
    console.log("before");

    var workbook = XLSX.readFile(req.file.path);
    console.log("upload products");

    var sheet_namelist = workbook.SheetNames;
    var x = 0;

    sheet_namelist.forEach((element) => {
      var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_namelist[x]]);

      // Product.insertMany(xlData);
      xlData.forEach(async (data) => {
        const product = new Product({
          name: data.name,
          quantity: data.quantity,
          imageUrl: data.imageUrl,
          sellingPrice: data.sellingPrice,
          retailPrice: data.retailPrice,
          description: data.description,
          brandName: data.brandName,
          features: data.features,
          creator: req.user._id,
          category: data.category,
        });
        const result = await product.save();
      });

      x++;
    });
    clearImage(req.file.path);
    return res.status(200).send({ message: "Products Entered Successfully!" });
  } catch (err) {
    res.status(500).send({ error: err });
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
