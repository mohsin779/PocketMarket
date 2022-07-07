require("dotenv").config();
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { StatusCodes } = require("http-status-codes");

const nodemailer = require("nodemailer");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const cloudinary = require("cloudinary").v2;

const CountryData = require("country-state-city").Country.getAllCountries();
const StateData = require("country-state-city").State;
const CityData = require("country-state-city").City;

const { Customer, CustomerValidations } = require("../models/customer");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { OrderedProduct } = require("../models/orderedProduct");
const { Address } = require("../models/address");
const { Card, CardValidations } = require("../models/card");
const { Rating } = require("../models/rating");
const { UserConversation } = require("../models/userConversation");
const { Conversation } = require("../models/conversation");
const { Message } = require("../models/message");

var transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "9b7908fdc202ef",
    pass: "1f751e6d25a72c",
  },
});

exports.getCountries = async (req, res, next) => {
  const newCountries = CountryData.map((country) => {
    return { name: country.name, countryCode: country.isoCode };
  });

  return res.status(200).send({ countries: newCountries });
};

exports.getStates = async (req, res, next) => {
  const { countryCode } = req.params;

  const states = StateData.getStatesOfCountry(countryCode);

  const newStates = states.map((state) => {
    return { name: state.name, stateCode: state.isoCode };
  });

  return res.status(200).send({ states: newStates });
};

exports.getCities = async (req, res, next) => {
  const { countryCode, stateCode } = req.params;

  const cities = CityData.getCitiesOfState(countryCode, stateCode);

  const newCities = cities.map((city) => {
    console.log(city);
    return { name: city.name, cityCode: city.isoCode };
  });

  return res.status(200).send({ cities: newCities });
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const { error } = CustomerValidations.validate(req.body);

    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: error.details[0].message });
    }

    const { name, email, password, phoneNumber, image } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).send("Could not find Customer");
    }
    let imageUrl;
    if (image) {
      let imagePath = await cloudinary.uploader.upload(image);
      imageUrl = imagePath.secure_url;
      // clearImage(req.file.path);
    }

    if (imageUrl && imageUrl !== customer.image) {
      var filename = customer.image.split("/").pop();
      filename = filename.split(".")[0];
      cloudinary.uploader.destroy(filename);
    }

    let hashedPw;

    let obj = { name, email, phoneNumber };

    if (password) {
      hashedPw = await bcrypt.hash(password, 12);
      obj = { ...obj, password: hashedPw };
    }

    if (imageUrl) {
      obj = { ...obj, image: imageUrl };
    }

    const user = await Customer.findOneAndUpdate(
      { _id: customerId },
      obj
    ).select("-password -__v");

    const updatedUser = await Customer.findById({ _id: user._id });

    res
      .status(200)
      .json({ message: "Customer details updated!", customer: updatedUser });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};

exports.myOrders = async (req, res, next) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.limit) || 10;

    const customerId = req.user._id;

    let totalItems = await Order.find({
      customerId: customerId,
    }).countDocuments();
    if (totalItems == 0) {
      return res.json({ error: "You did not placed any order" });
    }
    const orders = await Order.find({ customerId: customerId })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return res.json({
      orders: orders,
      totalpages: Math.ceil(totalItems / perPage),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};

exports.orderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const orderedProduct = await OrderedProduct.find({ orderId: orderId });

    return res.json({ orderedProduct: orderedProduct });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const addresses = await Address.find({ customerId: customerId });
    if (!addresses) {
      return res.json({ error: "No Address found" });
    }
    return res.json({ addresses: addresses });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.addNewAddress = async (req, res, next) => {
  try {
    const { country, state, city, area, houseNumber, streetNumber } = req.body;

    const address = new Address({
      customerId: req.user._id,
      country: country,
      state: state,
      city: city,
      area: area,
      houseNumber: houseNumber,
      streetNumber: streetNumber,
    });

    const result = await address.save();
    if (result) {
      res.status(200).send({ message: "Address added.", address: result });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findById(addressId);

    if (!address) {
      return res.status(404).send("Could not find Address");
    }
    if (address.customerId.toString() !== req.user._id) {
      return res.status(403).send("Not authorized!");
    }

    const result = await Address.findByIdAndRemove(addressId);
    if (result) {
      res.status(200).json({ message: "Address Deleted" });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.addToOrder = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const { paymentMethod, products, addressId, orderId } = req.body;

    const productData = await Promise.all(
      products.map(async (prod) => {
        return await Product.findById({ _id: prod._id });
      })
    );

    const totalPrice = productData.reduce((acc, product, i) => {
      return acc + products[i].quantity * product.sellingPrice;
    }, 0);

    if (paymentMethod === "card") {
      const { cardId } = req.body;
      const cardDetails = await Card.findById(cardId);
      const month = cardDetails.expiryDate.split("/")[0];
      const year = cardDetails.expiryDate.split("/")[1];
      const token = await stripe.tokens.create({
        card: {
          number: cardDetails.cardNumber,
          exp_month: month,
          exp_year: year,
          cvc: cardDetails.securityCode,
        },
      });

      const session = await stripe.charges.create({
        card: token.id,
        amount: totalPrice * 100,
        currency: "pkr",
        description: "This is a order from amazon",
      });

      if (session) {
        saveOrder(req, orderId, products, totalPrice, addressId, ln);
        return res.json({ id: session.id, total: totalPrice });
      } else {
        return res.status(401).send({ error: "No valid API key provided." });
      }
    } else {
      saveOrder(req, orderId, products, totalPrice, addressId, ln);
      return res.json({ message: "order added!" });
    }
  } catch (err) {
    res.status(500).send({ error: err.raw.message });
  }
};

exports.addCard = async (req, res, next) => {
  try {
    const { error } = CardValidations.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: error.details[0].message });
    }

    const { firstName, lastName, cardNumber, expiryDate, securityCode } =
      req.body;

    const card = new Card({
      customerId: req.user._id,
      firstName: firstName,
      lastName: lastName,
      cardNumber: cardNumber,
      expiryDate: expiryDate,
      securityCode: securityCode,
    });
    const result = card.save();
    if (result) {
      return res
        .status(200)
        .send({ message: "card added successfully!", card: card });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getCard = async (req, res, next) => {
  try {
    console.log(req.user._id);
    const cards = await Card.find({ customerId: req.user._id });
    // console.log(cards)
    if (cards) {
      return res.status(200).send({ cards: cards });
    } else {
      return res.state(404).send({ error: "no card found" });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.orderHistory = async (req, res, next) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.limit) || 10;

    const customerId = req.user._id;

    let totalItems = await Order.find({
      customerId: customerId,
      status: "delivered",
    }).countDocuments();

    if (totalItems == 0) {
      return res
        .status(404)
        .send({ orders: [], error: "you did not have any order history yet." });
    }
    const orders = await Order.find({
      customerId: customerId,
      status: "delivered",
    })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return res.json({
      orders: orders,
      totalpages: Math.ceil(totalItems / perPage),
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

const saveOrder = async (req, orderId, products, totalPrice, addressId, ln) => {
  const order = new Order({
    customerId: req.user._id,
    addressId: addressId,
    status: "pending",
    orderId: orderId,
    totalPrice: totalPrice,
  });
  await order.save();
  products.forEach(async (prod) => {
    const product = await Product.findById({ _id: prod._id });
    let productName = product.name.get(ln);
    if (productName == "") {
      productName = product.name.get("en");
    }
    const orderedProduct = new OrderedProduct({
      orderId: order._id,
      productId: product._id,
      quantity: prod.quantity,
      unitPrice: product.sellingPrice,
      name: productName,
      shopId: product.creator,
    });
    await orderedProduct.save();
  });

  updateProductsQuantity(products);
};

const updateProductsQuantity = async (products) => {
  products.forEach(async (prod) => {
    const product = await Product.findById({ _id: prod._id });
    const updatedQuantity = product.quantity - prod.quantity;
    product.quantity = updatedQuantity;
    await product.save();
  });
};

exports.sendEmailAndMessage = async (req, res, next) => {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email: email });

    if (!customer) {
      return res
        .status(404)
        .send({ error: "customer with this email not exist" });
    }

    const code = Math.floor(Math.random() * (99999 - 10000) + 10000);

    transporter.sendMail({
      to: email,
      from: "amazonClon@gmail.com",
      subject: "Password reset link",
      html:
        "<h2>Your requested to reset your account password.</h2></br><br>Use the given confirmation code to reset your password</br>code: " +
        code,
    });

    //TWILIO SETUP
    client.messages.create({
      body: "your reset password confirmation code is " + code,
      messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
      to: "+92" + customer.phoneNumber,
    });
    //END TWILIO SETUP

    return res.status(200).send({
      message: "We send an Email at: " + email + " with password reset code",
      code: code,
      email: email,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email: email });
    const hashedPw = await bcrypt.hash(password, 12);

    customer.password = hashedPw;
    await customer.save();
    res.status(200).send({ message: "Your password updated successfuly." });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.addRating = async (req, res, next) => {
  try {
    const { productId, rating } = req.body;
    const newRating = new Rating({
      customer: req.user._id,
      product: productId,
      rating: rating,
    });

    const result = await newRating.save();
    if (result) {
      return res.status(200).send({ message: "Thanks for your feedback!" });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.createChat = async (req, res, next) => {
  // const io = req.app.get("socketio");
  const { ln } = req.params;
  const { productId } = req.body;
  const prod = await Product.findById(productId);
  const uId = req.user._id;
  const conversations = await UserConversation.find({
    user: uId,
  }).populate("conversation");
  let conversation;
  if (conversations.length) {
    const product = conversations.find(
      (conv) => conv.conversation.productId == productId
    );
    if (!product) {
      conversation = await createConversation(ln, req.user._id, prod);
      res.send({
        message: "conversation created!",
        conversation: conversation,
      });
    } else {
      res.status(200).send({
        message: "Conversation already exists",
        conversation: product.conversation._id,
      });
    }
  } else {
    conversation = await createConversation(ln, req.user._id, prod);
    res.send({ message: "conversation created!", conversation: conversation });
  }
};

exports.sendMessage = async (req, res, next) => {
  const { conversation, message, user, shop, sender } = req.body;
  const newMessage = new Message({
    conversation: conversation,
    message: message,
    user: user,
    shop: shop,
    sendDate: new Date(),
    sender: sender,
  });
  await newMessage.save();
  const io = req.app.get("socketio");
  io.emit(`conversation-${conversation}`, newMessage);

  return res.send({ newMessage });
};

exports.getMessges = async (req, res, next) => {
  const { conversation } = req.params;
  const messages = await Message.find({ conversation: conversation }).select(
    "sender message sendDate"
  );
  res.send({ messages });
};
const createConversation = async (ln, userId, product) => {
  const user = await Customer.findById(userId);
  const conversation = new Conversation({
    productId: product._id,
    chatRoom: user.name + " " + product.name.get(ln),
  });
  await conversation.save();
  const userConversation = new UserConversation({
    user: userId,
    shop: product.creator,
    conversation: conversation._id,
  });
  await userConversation.save();

  return conversation._id;
};
