const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const { SuperAdmin } = require("../models/superAdmin");
const { Shop } = require("../models/shop");
const { Customer, CustomerValidations } = require("../models/customer");

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
  try {
    const { error } = CustomerValidations.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: error.details[0].message });
    }

    const { name, email, password, phoneNumber } = req.body;

    const existingCustomer = await Customer.findOne({ email: email });
    if (existingCustomer) {
      return res
        .status(401)
        .send({ error: "A Customer with this email already exists" });
    }
    const hashedPw = await bcrypt.hash(password, 12);

    const customer = new Customer({
      name: name,
      email: email,
      password: hashedPw,
      phoneNumber: phoneNumber,
      image: "",
    });
    const result = await customer.save();
    const token = result.genAuthToken();
    const createdCustomer = {
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      image: customer.image,
    };
    res.status(201).json({
      message: "Customer created!",
      token: token,
      customer: createdCustomer,
    });
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
      phoneNumber: customer.phoneNumber,
      _id: customer._id,
      image: customer.image,
    };

    res.status(200).json({ token: token, customer: sendCustomer });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.googleLogin = async (req, res, next) => {
//   try {
//     const token = req.user.genAuthToken();
//     const customer = {
//       name: req.user.name,
//       email: req.user.email,
//       _id: req.user._id,
//     };
//     res.status(200).json({
//       customer: customer,
//       token: token,
//     });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

exports.socialLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const { payload } = await client.verifyIdToken({
      idToken: tokenId,
      requiredAudience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, email_verified, name, picture } = payload;
    let token;
    if (email_verified) {
      const existingCustomer = await Customer.findOne({ email: email });

      if (!existingCustomer) {
        const customer = new Customer({
          name: name,
          email: email,
          password: null,
          phoneNumber: null,
          image: picture,
        });
        const result = await customer.save();
        token = result.genAuthToken();
        const newCustomer = {
          _id: result._id,
          name: result.name,
          email: result.email,
          phoneNumber: result.phoneNumber,
          image: result.image,
        };
        res.status(200).send({ customer: newCustomer, token: token });
      } else {
        const customer = {
          _id: existingCustomer._id,
          name: existingCustomer.name,
          email: existingCustomer.email,
          phoneNumber: existingCustomer.phoneNumber,
          image: existingCustomer.image,
        };
        const token = existingCustomer.genAuthToken();
        res.status(200).send({ customer: customer, token: token });
      }
    } else {
      res.status(401).send({ error: "Your email is not verified" });
    }
  } catch (error) {
    res.status(500).send({ error: error });
  }
};
