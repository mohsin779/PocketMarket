const mongoose = require("mongoose");
const Joi = require("joi").extend(require("@joi/date"));

const Schema = mongoose.Schema;

const userConversationSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    require: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    require: true,
  },
  participentId: {
    type: Schema.Types.ObjectId,
    ref: "Shop",
    require: true,
  },
});

const validation = Joi.object({
  message: Joi.string().trim(true).required(),
});

const UserConversation = mongoose.model(
  "UserConversation",
  userConversationSchema
);
exports.UserConversation = UserConversation;
exports.UserConversationValidations = validation;
