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
    console.log(customerId, " && ", req.user._id);

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

exports.addToOrder = async (req, res, next) => {
  try {
    const { paymentMethod, products } = req.body;
    /////////////////////////////////////////////////////////////////
    if (paymentMethod === "card") {
      const session = stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.forEach(async (prod) => {
          const product = await Product.findById({ _id: prod._id });
          return {
            orderId: order._id,
            productId: product._id,
            quantity: prod.quantity,
            unitPrice: product.unitPrice,
            name: product.name,
          };
        }),
      });
    }
    //////////////////////////////////////////////////////////////////
    const productData = await Promise.all(
      products.map(async (prod) => {
        return await Product.findById({ _id: prod._id });
      })
    );

    const totalPrice = productData.reduce((acc, product, i) => {
      return acc + products[i].quantity * product.sellingPrice;
    }, 0);

    const order = new Order({
      customerId: req.user._id,
      status: "Pending",
      totalPrice: totalPrice,
    });
    await order.save();

    products.forEach(async (prod) => {
      const product = await Product.findById({ _id: prod._id });
      const orderedProduct = new OrderedProduct({
        orderId: order._id,
        productId: product._id,
        quantity: prod.quantity,
        unitPrice: product.unitPrice,
        name: product.name,
      });
      await orderedProduct.save();
    });

    res.send("Hello");
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
