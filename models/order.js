// const mongoose = require("mongoose");
// const Joi = require("joi");

// const Schema = mongoose.Schema;

// const orderSchema = new Schema({
//   customerId: {
//     type: Schema.Types.ObjectId,
//     ref: "Customer",
//     require: true,
//   },
//   addressId: {
//     type: Schema.Types.ObjectId,
//     ref: "Address",
//     require: true,
//   },
//   orderId: String,
//   status: {
//     type: String,
//   },
//   totalPrice: {
//     type: Number,
//   },
// });

// const validation = Joi.object({
//   orderId: Joi.string().required(),
//   status: Joi.string().default("Pending"),
//   totalPrice: Joi.number().positive().greater(1).precision(2).required(),
// });
// const Order = mongoose.model("Order", orderSchema);
// exports.Order = Order;
// exports.OrderValidations = validation;

////////////////////////////////////////////////////

const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Order = sequelize.define("order", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  orderId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  totalPrice: Sequelize.INTEGER,
});

module.exports = Order;
