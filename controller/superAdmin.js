const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const XLSX = require("xlsx");

const { Role } = require("../models/roles");
const { Shop } = require("../models/shop");
const { Category } = require("../models/category");
const { UpdateRequest } = require("../models/updateRequests");
const { OrderedProduct } = require("../models/orderedProduct");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { Language } = require("../models/language");

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.status(200).send({ roles: roles });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
exports.getShops = async (req, res, next) => {
  try {
    const shops = await Shop.find().select("-password").populate("role");
    res.status(200).send({ shops: shops });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.createShop = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    const existingShop = await Shop.findOne({ email: email });
    if (existingShop) {
      return res
        .status(401)
        .send({ error: "A shop with this email already exists" });
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const shop = new Shop({
      name: name,
      email: email,
      password: hashedPw,
      role: role,
    });
    await shop.save();

    const createdShop = await Shop.findById({ _id: shop._id })
      .select("-password")
      .populate("role");

    res.status(201).json({
      message: "Shop created!",
      shop: createdShop,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.updateShop = async (req, res, next) => {
  try {
    const shopId = req.params.shopId;

    const shop = await Shop.findById(shopId);
    const update = await UpdateRequest.findOne({ shopId: shopId });
    if (!shop) {
      return res.status(404).send("Could not find Shop");
    }
    if (!update) {
      return res
        .status(404)
        .send("There is no update found regarding this Shop ID!");
    }
    shop.name = update.name;
    shop.email = update.email;
    if (update.password) {
      shop.password = update.password;
    }
    const result = await shop.save();
    if (result) {
      const deleteId = await UpdateRequest.findOne({ shopId: shopId });
      await UpdateRequest.findByIdAndRemove({ _id: deleteId._id });
    }
    res.status(200).json({ message: "Shop updated!", shop: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUpdateRequests = async (req, res, next) => {
  // console.log("hello");
  try {
    const updateRequests = await UpdateRequest.find();
    res.status(200).send({ updateRequests: updateRequests });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.deleteUpdateRequest = async (req, res, next) => {
  try {
    const requestID = req.params.requestId;
    await UpdateRequest.findByIdAndRemove({ _id: requestID });
    res.status(200).send("request deleted");
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const { name } = req.body;

    const categories = await Category.find();

    let checkCategory = categories.some(
      (category) => category.name.get(ln).toUpperCase() == name.toUpperCase()
    );

    if (checkCategory) {
      clearImage(req.file.path);
      return res
        .status(401)
        .send({ error: "A Category with this name already exists" });
    }

    if (!req.file) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: "please add an image for this category" });
    }
    let imagePath = await cloudinary.uploader.upload(req.file.path);

    const dblanguages = await Language.find();

    let languages = dblanguages.map((language) => {
      return language.code;
    });

    languages = languages.reduce((acc, curr) => ((acc[curr] = ""), acc), {});

    const category = new Category({
      name: { ...languages, [ln]: name },
      imageUrl: imagePath.secure_url,
    });
    clearImage(req.file.path);

    const result = await category.save();

    res.status(201).json({
      message: "Category created!",
      category: result,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { categoryId, ln } = req.params;
    const { name } = req.body;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).send({ error: "Could not find Category" });
    }

    const categories = await Category.find();

    let checkCategory = categories.some(
      (category) => category.name.get(ln).toUpperCase() == name.toUpperCase()
    );

    if (checkCategory) {
      clearImage(req.file.path);
      return res
        .status(401)
        .send({ error: "A Category with this name already exists" });
    }
    let imageUrl;
    if (req.file) {
      let imagePath = await cloudinary.uploader.upload(req.file.path);
      imageUrl = imagePath.secure_url;
      clearImage(req.file.path);
    }
    if (imageUrl && imageUrl !== category.imageUrl) {
      var filename = category.imageUrl.split("/").pop();
      filename = filename.split(".")[0];
      cloudinary.uploader.destroy(filename);
    }
    category.name.set(ln, name);
    if (imageUrl) {
      category.imageUrl = imageUrl;
    }
    const result = await category.save();
    if (result) {
      res.status(200).json({ message: "Category updated!", category: result });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.deleteShop = async (req, res, next) => {
  try {
    const shopId = req.params.shopId;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).send({ error: "shop with this ID not found" });
    }
    await OrderedProduct.deleteMany({ shopId: shopId });

    const orders = await Order.find();

    orders.forEach(async (order) => {
      let count = await OrderedProduct.countDocuments({ orderId: order._id });
      if (count === 0) {
        await Order.findByIdAndRemove({ _id: order._id });
      }
    });
    const products = await Product.find({ creator: shopId });
    if (products) {
      products.forEach(async (product) => {
        var filename = product.imageUrl.split("/").pop();
        filename = filename.split(".")[0];
        cloudinary.uploader.destroy(filename);
        await Product.findByIdAndRemove({ _id: product._id });
      });
      await Shop.findByIdAndRemove({ _id: shopId });
    }

    return res.json({ message: "shop deleted", shop: shop });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.uploadCategories = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const categories = await Category.find();

    var workbook = XLSX.readFile(req.file.path);
    var sheet_namelist = workbook.SheetNames;
    var x = 0;

    // start getting languages from data base
    const dblanguages = await Language.find();

    let languages = dblanguages.map((language) => {
      return language.code;
    });

    languages = languages.reduce((acc, curr) => ((acc[curr] = ""), acc), {});
    // end getting languages.

    sheet_namelist.forEach((element) => {
      var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_namelist[x]]);
      xlData.forEach(async (data) => {
        let existingCategory = categories.some(
          (category) =>
            category.name.get(ln).toUpperCase() == data.name.toUpperCase()
        );
        if (!existingCategory) {
          const category = new Category({
            name: { ...languages, [ln]: data.name },
            imageUrl: data.imageUrl,
          });
          const result = await category.save();
        }
      });
      x++;
    });
    clearImage(req.file.path);
    return res.status(200).send({ message: "Data entered successfully!" });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.downloadCategoriesList = async (req, res, next) => {
  try {
    var wb = XLSX.utils.book_new(); //new workbook
    Category.find((err, data) => {
      if (err) {
        console.log(err);
      } else {
        var temp = JSON.stringify(data);
        temp = JSON.parse(temp);
        var ws = XLSX.utils.json_to_sheet(temp);

        var down = path.basename("/uploads/categories.xlsx");

        XLSX.utils.book_append_sheet(wb, ws, "sheet1");
        XLSX.writeFile(wb, down);
        res.download(down);
      }
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.addLanguage = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const lan = new Language({
      name: name,
      code: code,
    });
    await lan.save();
    return res.status(200).send({ message: "language added." });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
