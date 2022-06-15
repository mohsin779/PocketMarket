const express = require("express");

const publicConrtoller = require("../controller/publicController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/category/get-categories", publicConrtoller.getCategories);
router.get("/products/get-products", publicConrtoller.getProducts);
router.get("/shops/get-single-shop/:shopId", publicConrtoller.getShop);
router.get("/products/get-product/:productId", publicConrtoller.getProduct);

module.exports = router;