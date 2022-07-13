// // const { number } = require('joi');
// const Joi = require("joi");

// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const productSchema = new Schema({
//   name: {
//     type: Map,
//     of: String,
//   },
//   quantity: Number,
//   imageUrl: String,
//   sellingPrice: Number,
//   retailPrice: Number,
//   description: {
//     type: Map,
//     of: String,
//   },
//   brandName: String,
//   features: {
//     type: Map,
//     of: String,
//   },
//   creator: {
//     type: Schema.Types.ObjectId,
//     ref: "Shop",
//     require: true,
//   },
//   category: {
//     type: Schema.Types.ObjectId,
//     ref: "Category",
//     require: true,
//   },
// });

// const validation = Joi.object({
//   // name: Joi.string().min(3).max(25).trim(true).required(),
//   quantity: Joi.number().required(),
//   sellingPrice: Joi.number().positive().greater(1).precision(2).required(),
//   retailPrice: Joi.number().positive().greater(1).precision(2).required(),
//   description: Joi.string().min(3).max(25).trim(true).required(),
//   imageUrl: Joi.string().trim(true).required(),
// });

// const Product = mongoose.model("Product", productSchema);
// exports.Product = Product;
// exports.ProductValidations = validation;

///////////////////////////////////////////////

const Sequelize = require("sequelize");

const sequelize = require("../database");

const Product = sequelize.define("product", {
  _id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Map,
    of: Sequelize.STRING,
  },
  quantity: Sequelize.INTEGER,
  sellingPrice: {
    type: Sequelize.DOUBLE,
    allowNull: false,
  },
  retailPrice: {
    type: Sequelize.DOUBLE,
    allowNull: false,
  },
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Map,
    of: Sequelize.STRING,
  },
  brandName: Sequelize.STRING,
  features: {
    type: Map,
    of: Sequelize.STRING,
  },
});

module.exports = Product;
