const bcrypt = require("bcryptjs");
const stripe = require("stripe")(
  "sk_test_51L510HD6MLn8tqd5C7eNFKZrwPYh4p6yRCdzY25ByZwS2EYNtUqkqOWw8O4FdFNcRdNxHlU1VTD50wGmG9xKicqK00ojNx5w5N"
);

const { Customer } = require("../models/customer");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { OrderedProduct } = require("../models/orderedProduct");

exports.updateCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;

    const { name, email, password, address, phone } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).send("Could not find Customer");
    }
    // console.log(customerId, " && ", req.user._id);

    if (customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: "Not authorized!" });
    }
    customer.name = name;
    customer.email = email;
    if (password) {
      const hashedPw = await bcrypt.hash(password, 12);
      customer.password = hashedPw;
    }
    customer.address = address;
    customer.phoneNumber = phone;
    const result = await customer.save();
    res
      .status(200)
      .json({ message: "Customer details updated!", customer: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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
    next(err);
  }
};
exports.orderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const orderedProduct = await OrderedProduct.find({ orderId: orderId });

    return res.json({ orderedProduct: orderedProduct });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.addToOrder = async (req, res, next) => {
  try {
    const { paymentMethod, products } = req.body;

    const productData = await Promise.all(
      products.map(async (prod) => {
        return await Product.findById({ _id: prod._id });
      })
    );

    const totalPrice = productData.reduce((acc, product, i) => {
      return acc + products[i].quantity * product.sellingPrice;
    }, 0);

    if (paymentMethod === "card") {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: productData.map((product, i) => {
          return {
            currency: "pkr",
            quantity: products[i].quantity,
            amount: product.sellingPrice * products[i].quantity * 100,
            name: product.name,
          };
        }),
        success_url: req.protocol + "://" + req.get("host"), //http://localhost:8080
        cancel_url: req.protocol + "://" + req.get("host"), //http://localhost:8080
      });
      if (session) {
        saveOrder(req, products, totalPrice);
        return res.json({ id: session.id, total: totalPrice });
      } else {
        return res.status(401).send({ error: "No valid API key provided." });
      }
    } else {
      saveOrder(req, products, totalPrice);
      return res.json({ message: "order added!" });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const saveOrder = async (req, products, totalPrice) => {
  const order = new Order({
    customerId: req.user._id,
    status: "pending",
    totalPrice: totalPrice,
  });
  await order.save();

  products.forEach(async (prod) => {
    const product = await Product.findById({ _id: prod._id });
    const orderedProduct = new OrderedProduct({
      orderId: order._id,
      productId: product._id,
      quantity: prod.quantity,
      unitPrice: product.retailPrice,
      name: product.name,
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
