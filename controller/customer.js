const bcrypt = require("bcryptjs");
const stripe = require("stripe")(
  "sk_test_51L510HD6MLn8tqd5C7eNFKZrwPYh4p6yRCdzY25ByZwS2EYNtUqkqOWw8O4FdFNcRdNxHlU1VTD50wGmG9xKicqK00ojNx5w5N"
);
const { StatusCodes } = require("http-status-codes");

const nodemailer = require("nodemailer");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const CountryData = require("country-state-city").Country.getAllCountries();
const StateData = require("country-state-city").State;
const CityData = require("country-state-city").City;

const { Customer, CustomerValidations } = require("../models/customer");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { OrderedProduct } = require("../models/orderedProduct");
const { Address } = require("../models/address");
const { Card, CardValidations } = require("../models/card");

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
    const customerId = req.params.customerId;
    const { error } = CustomerValidations.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ error: error.details[0].message });
    }

    const { name, email, password, phone } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).send("Could not find Customer");
    }

    if (customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: "Not authorized!" });
    }
    customer.name = name;
    customer.email = email;
    if (password) {
      const hashedPw = await bcrypt.hash(password, 12);
      customer.password = hashedPw;
    }
    customer.phoneNumber = phone;
    const result = await customer.save();
    res
      .status(200)
      .json({ message: "Customer details updated!", customer: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};
exports.myOrders = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const orders = await Order.find({ customerId: customerId });
    if (!orders) {
      return res.json({ error: "You did not placed any order" });
    }
    return res.json({ orders: orders });
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
    const { email } = req.user;

    let productName;
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
    const customerId = req.user._id;
    const orders = await Order.find({
      customerId: customerId,
      status: "delivered",
    });
    if (!orders) {
      return res
        .status(404)
        .send({ error: "you did not have any order history yet." });
    }
    return res.json({ orders: orders });
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
  if (ln == "en") {
    products.forEach(async (prod) => {
      const product = await Product.findById({ _id: prod._id });
      let productName = product.name.nameEn;
      if (productName == "") {
        productName = product.name.nameFr;
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
  } else if (ln == "fr") {
    products.forEach(async (prod) => {
      const product = await Product.findById({ _id: prod._id });
      let productName = product.name.nameFr;
      if (productName == "") {
        productName = product.name.nameEn;
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
  }

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
