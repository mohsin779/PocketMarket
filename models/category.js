const mongoose = require('mongoose');
const Joi = require('joi');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: String,
  superAdmin:{
    type: Schema.Types.ObjectId,
    ref: 'SuperAdmin'
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }
  ]
});

const validation = Joi.object({
  name: Joi.string().alphanum().min(3).max(25).trim(true).required(),
});

const Category= mongoose.model('Category', categorySchema);
exports.Category=Category;
exports.CategoryValidations=validation;

