const express = require("express");

const publicConrtoller = require("../controller/publicController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/category/:ln/get-categories", publicConrtoller.getCategories);
router.get(
  "/products/:ln/get-products/:categoryId",
  publicConrtoller.getProducts
);
router.get("/shops/get-single-shop/:shopId", publicConrtoller.getShop);
router.get("/products/:ln/get-product/:productId", publicConrtoller.getProduct);
router.post("/products/:ln/change-names", publicConrtoller.changeNames);
router.post("/products/:ln/search", publicConrtoller.search);
router.get("/products/ratings/:productId", publicConrtoller.getRatings);

module.exports = router;
