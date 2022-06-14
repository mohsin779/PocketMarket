const express = require("express");

const publicConrtoller = require("../controller/publicController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/get-categories", publicConrtoller.getCategories);
router.get("/get-products", publicConrtoller.getProducts);
router.get("/get-single-shop/:shopId", publicConrtoller.getShop);
router.get("/get-product/:productId", publicConrtoller.getProduct);

module.exports = router;
