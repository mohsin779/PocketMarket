const bcrypt = require("bcryptjs");
const { Role } = require("../models/roles");
const { Shop } = require("../models/shop");
const { Category } = require("../models/category");

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

exports.getShop = async (req, res, next) => {
  const shopId = req.params.shopId;
  const shop = await Shop.findById(shopId);
  try {
    if (!shop) {
      const error = new Error("Could not find Shop.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Shop fetched.", shop: shop });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateShop = async (req, res, next) => {
  const shopId = req.params.shopId;

  const { name, email, password, role } = req.body;

  try {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      const error = new Error("Could not find Shop.");
      error.statusCode = 404;
      throw error;
    }
    shop.name = name;
    shop.email = email;
    if (password) {
      const hashedPw = await bcrypt.hash(password, 12);
      shop.password = hashedPw;
    }
    shop.role = role;
    const result = await shop.save();
    res.status(200).json({ message: "Shop updated!", shop: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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

    const category = new Category({
      name: name,
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
