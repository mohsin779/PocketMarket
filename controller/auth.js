require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { Shop } = require("../models/shop");
const { SuperAdmin } = require("../models/superAdmin");

exports.shopLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const shop = await Shop.findOne({ email: email }).populate("role");
    if (!shop) {
      return res
        .status(404)
        .send({ error: "User with this email doest not exist" });
    }

    const isEqual = await bcrypt.compare(password, shop.password);

    if (!isEqual) {
      return res.status(401).send({ error: "Incorrect password" });
    }
    const token = shop.genAuthToken();

    const sendShop = {
      name: shop.name,
      email: shop.email,
      role: shop.role,
      _id: shop._id,
    };

    res.status(200).json({ token: token, shop: sendShop });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const superAdmin = await SuperAdmin.findOne({ email: email }).populate(
      "role"
    );
    if (!superAdmin) {
      return res
        .status(404)
        .send({ error: "Admin with this email doest not exist" });
    }

    const isEqual = await bcrypt.compare(password, superAdmin.password);

    if (!isEqual) {
      return res.status(401).send({ error: "Incorrect password" });
    }
    const token = superAdmin.genAuthToken();

    const sendAdmin = {
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role,
      _id: superAdmin._id,
    };

    res.status(200).json({ token: token, superAdmin: sendAdmin });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
