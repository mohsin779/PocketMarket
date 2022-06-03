const mongoose = require('mongoose');
const Joi = require('joi');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  CustomerId:{
    type:Schema.Types.ObjectId,
    ref:'Customer',
    require:true
  },
  Status:{
      type:String,
      default:'Pending'
  },
  totalPrice: {
    type: Float32Array,
    default:0.0
  },
 
  orderedProducts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'OrderedProduct'
    }
  ]
});

const validation = Joi.object({
  Status: Joi.string().default('Pending'),
  totalPrice:Joi.number().positive().greater(1).precision(2).required()
});
const Order=mongoose.model('Order', orderSchema);
exports.Order=Order;
exports.OrderValidations=validation;