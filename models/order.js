const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    require: true,
  },
  addressId: {
    type: Schema.Types.ObjectId,
    ref: "Address",
    require: true,
  },
  status: {
    type: String,
  },
  totalPrice: {
    type: Number,
  },
});

const validation = Joi.object({
  Status: Joi.string().default("Pending"),
  totalPrice: Joi.number().positive().greater(1).precision(2).required(),
});
const Order = mongoose.model("Order", orderSchema);
exports.Order = Order;
exports.OrderValidations = validation;
