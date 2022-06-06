require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { Shop } = require("../models/shop");

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  let loadedShop;
  try {
    const shop = await Shop.findOne({ email: email });
    if (!shop) {
      const error = new Error("A Shop with this email could not be found.");
      error.statusCode = 401;
      throw error;
    }
    loadedShop = shop;
    const isEqual = await bcrypt.compare(password, shop.password);
    if (!isEqual) {
      const error = new Error("Wrong password!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loadedShop.email,
        shopId: loadedShop._id.toString(),
      },
      process.env.SUPER_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token, shopId: loadedShop._id.toString() });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
