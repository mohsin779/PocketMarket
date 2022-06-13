const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/is-auth");
const customerController = require("../controller/customer");

router.put(
  "/update-customer/:customerId",
  isAuth,
  customerController.updateCustomer
);
router.post("/add-to-order", isAuth, customerController.addToOrder);

module.exports = router;
