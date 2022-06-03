// const { number } = require('joi');
const Joi = require('joi');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: String,
  quantity:Number,
  price:Number,
  admin:{
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      require:true
    },
  category:{
      type:Schema.Types.ObjectId,
      ref:'Category',
      require:true
    }, 
  
});

const validation = Joi.object({
    name: Joi.string().alphanum().min(3).max(25).trim(true).required(),
    quantity:Joi.number().required(),
    price:Joi.number().positive().greater(1).precision(2).required(),
});

const Product=mongoose.model('Product', productSchema);
exports.Product=Product;
exports.ProductValidations=validation;
