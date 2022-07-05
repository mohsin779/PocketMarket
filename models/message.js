const mongoose = require("mongoose");
const Joi = require("joi").extend(require("@joi/date"));

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    require: true,
  },
  message: String,
});

const validation = Joi.object({
  message: Joi.string().trim(true).required(),
});

const Message = mongoose.model("Message", messageSchema);
exports.Message = Message;
exports.MessageValidations = validation;
