require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { SuperAdmin } = require("../models/superAdmin");
const { Shop } = require("../models/shop");
const { Customer } = require("../models/customer");

// Google Auth
// const { OAuth2Client } = require("google-auth-library");
// const client = new OAuth2Client(process.env.CLIENT_ID);

exports.shopLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const shop = await Shop.findOne({ email: email }).populate("role");
    if (!shop) {
      return res
        .status(404)
        .send({ error: "Shop with this email doest not exist" });
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

exports.customerSignup = async (req, res, next) => {
  const { name, email, password, address, phone } = req.body;

  try {
    const hashedPw = await bcrypt.hash(password, 12);

    const customer = new Customer({
      name: name,
      address: address,
      phoneNumber: phone,
      email: email,
      password: hashedPw,
    });
    const result = await customer.save();

    res.status(201).json({ message: "Customer created!", customer: customer });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.customerLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const customer = await Customer.findOne({ email: email });
    if (!customer) {
      return res
        .status(401)
        .send({ error: "A customer with this email could not be found." });
    }

    const isEqual = await bcrypt.compare(password, customer.password);
    if (!isEqual) {
      return res.status(401).send({ error: "Wrong password!" });
    }

    const token = customer.genAuthToken();

    const sendCustomer = {
      name: customer.name,
      email: customer.email,
      _id: customer._id,
    };

    res.status(200).json({ token: token, customer: sendCustomer });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const token = req.user.genAuthToken();
    const customer = {
      name: req.user.name,
      email: req.user.email,
      _id: req.user._id,
    };
    res.status(200).json({
      customer: customer,
      token: token,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
