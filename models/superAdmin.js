const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const superAdminSchema = new Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: Schema.Types.ObjectId,
    ref: "Role",
  },
});

const validation = Joi.object({
  name: Joi.string().min(3).max(25).trim(true).required(),
  email: Joi.string().email().trim(true).required(),
  password: Joi.string().min(8).trim(true).required(),
  role: Joi.string().required(),
});
const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
exports.SuperAdmin = SuperAdmin;
exports.SuperAdminValidations = validation;
