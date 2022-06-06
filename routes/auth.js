const express = require("express");

const authController = require("../controller/auth");
const router = express.Router();

router.post("/shop/login", authController.shopLogin);
router.post("/admin/login", authController.adminLogin);

module.exports = router;
