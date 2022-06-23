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
router.get("/my-orders", isAuth, customerController.myOrders);
router.get("/order-detail/:orderId", isAuth, customerController.orderDetails);
router.get("/orders-history", isAuth, customerController.orderHistory);
router.get("/send-code", customerController.sendEmail);
router.put("/reset-password", customerController.resetPassword);
module.exports = router;
