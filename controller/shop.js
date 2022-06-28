const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const XLSX = require("xlsx");
const nodemailer = require("nodemailer");

const { StatusCodes } = require("http-status-codes");
const { Product } = require("../models/product");
const { Shop } = require("../models/shop");
const { UpdateRequest } = require("../models/updateRequests");
const { OrderedProduct } = require("../models/orderedProduct");
const { Order } = require("../models/order");

var transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "9b7908fdc202ef",
    pass: "1f751e6d25a72c",
  },
});

exports.myShop = async (req, res, next) => {
  const shopId = req.user._id;
  const shop = await Shop.findById(shopId);
  try {
    if (!shop) {
      return res.status(404).send("Could not find Shop");
    }
    res.status(200).json({ shop: shop });
  } catch (err) {
    res.status(500).send({ error: err });

    next(err);
  }
};

exports.myProducts = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const shopId = req.user._id;
    const products = await Product.find({ creator: shopId }).populate(
      "category"
    );
    if (!products) {
      return res.json({ error: "You dont have any product" });
    }
    const prods = products.map((p) => {
      return productsInSelectedLanguage(ln, p);
    });
    console.log(prods);
    return res.json({ products: prods });
  } catch (err) {
    res.status(500).send({ error: err });

    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const productId = req.params.productId;
    const product = await Product.findById(productId).populate("category");
    if (req.user._id.toString() !== product.creator.toString()) {
      return res.status(401).send({ error: "Not Authorized" });
    }
    if (!product) {
      return res.status(404).send({ error: "Could not find Product." });
    }
    let fetchedProduct = productsInSelectedLanguage(ln, product);

    res
      .status(200)
      .json({ message: "Product fetched.", product: fetchedProduct });
  } catch (err) {
    res.status(500).send({ error: err });

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
    res.status(500).send({ error: err });

    next(err);
  }
};

exports.addProduct = async (req, res) => {
  try {
    const file = req.file;
    const { ln } = req.params;
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
    let nameEn = "",
      nameFr = "",
      descriptionEn = "",
      descriptionFr = "",
      featuresEn = "",
      featuresFr = "";
    if (ln == "en") {
      nameEn = name;
      descriptionEn = description;
      featuresEn = features;
    } else if (ln == "fr") {
      nameFr = name;
      descriptionFr = description;
      featuresFr = features;
    }
    const product = new Product({
      name: { nameEn, nameFr },
      quantity: quantity,
      sellingPrice: sellingPrice,
      retailPrice: retailPrice,
      description: { descriptionEn, descriptionFr },
      imageUrl: imagePath.secure_url,
      creator: req.user._id,
      category: category,
      brandName: brandName,
      features: { featuresEn, featuresFr },
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
    const { productId, ln } = req.params;

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

    if (ln == "en") {
      product.name.nameEn = name;
      product.description.descriptionEn = description;
      product.features.featuresEn = features;
    } else if (ln == "fr") {
      product.name.nameFr = name;
      product.description.descriptionFr = description;
      product.features.featuresFr = features;
    }

    product.quantity = quantity;
    product.sellingPrice = sellingPrice;
    product.retailPrice = retailPrice;
    product.brandName = brandName;
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
    var workbook = XLSX.readFile(req.file.path);

    var sheet_namelist = workbook.SheetNames;
    var x = 0;

    sheet_namelist.forEach((element) => {
      var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_namelist[x]]);

      // Product.insertMany(xlData);
      xlData.forEach(async (data) => {
        const nameEn = data.nameEn;
        const nameFr = data.nameFr;
        const descriptionEn = data.descriptionEn;
        const descriptionFr = data.descriptionFr;
        const featuresEn = data.featuresEn;
        const featuresFr = data.featuresFr;
        const product = new Product({
          name: { nameEn, nameFr },
          quantity: data.quantity,
          imageUrl: data.imageUrl,
          sellingPrice: data.sellingPrice,
          retailPrice: data.retailPrice,
          description: { descriptionEn, descriptionFr },
          brandName: data.brandName,
          features: { featuresEn, featuresFr },
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

exports.downloadProductsList = async (req, res, next) => {
  try {
    var wb = XLSX.utils.book_new(); //new workbook
    Product.find((err, data) => {
      if (err) {
        console.log(err);
      } else {
        var temp = JSON.stringify(data);
        temp = JSON.parse(temp);
        var ws = XLSX.utils.json_to_sheet(temp);

        var down = path.basename("/uploads/products.xlsx");

        XLSX.utils.book_append_sheet(wb, ws, "sheet1");
        XLSX.writeFile(wb, down);
        res.download(down);
      }
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.sendEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const shop = await Shop.findOne({ email: email });
    if (!shop) {
      return res.status(404).send({ error: "Shop with this email not exist" });
    }

    const code = Math.floor(Math.random() * (99999 - 10000) + 10000);

    transporter.sendMail({
      to: email,
      from: "amazonClon@gmail.com",
      subject: "Password reset link",
      html:
        "<h2>Your requested to reset your account password.</h2></br><br>Use the given confirmation code to reset your password</br>code: " +
        code,
    });
    return res.status(200).send({
      message: "Email sent to " + email + " with password reset code",
      code: code,
      email: email,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const shop = await Shop.findOne({ email: email });
    const hashedPw = await bcrypt.hash(password, 12);

    shop.password = hashedPw;
    await shop.save();
    res.status(200).send({ message: "Your password updated successfuly." });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

const productsInSelectedLanguage = (ln, product) => {
  let fetchedProduct;
  if (ln == "en") {
    fetchedProduct = {
      ...product._doc,
      name: product.name.nameEn,
      description: product.description.descriptionEn,
      features: product.features.featuresEn,
    };
    if (fetchedProduct.name == "") {
      fetchedProduct = { ...fetchedProduct, name: product.name.nameFr };
    }
    if (fetchedProduct.description == "") {
      fetchedProduct = {
        ...fetchedProduct,
        description: product.description.descriptionFr,
      };
    }
    if (fetchedProduct.features == "") {
      fetchedProduct = {
        ...fetchedProduct,
        features: product.features.featuresFr,
      };
    }
  } else if (ln == "fr") {
    fetchedProduct = {
      ...product._doc,
      name: product.name.nameFr,
      description: product.description.descriptionFr,
      features: product.features.featuresFr,
    };
    if (fetchedProduct.name == "") {
      fetchedProduct = { ...fetchedProduct, name: product.name.nameEn };
    }
    if (fetchedProduct.description == "") {
      fetchedProduct = {
        ...fetchedProduct,
        description: product.description.descriptionEn,
      };
    }
    if (fetchedProduct.features == "") {
      fetchedProduct = {
        ...fetchedProduct,
        features: product.features.featuresEn,
      };
    }
  }
  return fetchedProduct;
};
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
