const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;

const customerSchema = new Schema({
  name: String,
  phoneNumber: Number,
  email: String,
  password: String,
});

customerSchema.methods.genAuthToken = function () {
  const token = jwt.sign(
    {
      email: this.email,
      _id: this._id.toString(),
    },
    process.env.SUPER_KEY
    // { expiresIn: "1h" }
  );

  return token;
};

const validation = Joi.object({
  name: Joi.string().min(3).max(25).trim(true).required(),
  email: Joi.string().email().trim(true).required(),
  password: Joi.string().min(8).trim(true),
  phoneNumber: Joi.string().required(),
});

const Customer = mongoose.model("Customer", customerSchema);
exports.Customer = Customer;
exports.CustomerValidations = validation;
