const bcrypt = require("bcryptjs");
const { Role } = require("../models/roles");
const { Shop } = require("../models/shop");
const { Category } = require("../models/category");
const { UpdateRequest } = require("../models/updateRequests");

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
    const roleId = await Role.findOne({ name: role });

    const hashedPw = await bcrypt.hash(password, 12);
    const shop = new Shop({
      name: name,
      email: email,
      password: hashedPw,
      role: roleId,
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

exports.addCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const existingCategory = await Category.findOne({ name: name });
    if (existingCategory) {
      return res
        .status(401)
        .send({ error: "A Category with this name already exists" });
    }
    if (!req.file) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: "please add an image for this category" });
    }

    const category = new Category({
      name: name,
      imageUrl: req.file.path,
    });
    const result = await category.save();

    res.status(201).json({
      message: "Category created!",
      category: result,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
