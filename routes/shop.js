const express = require("express");

const shopController = require("../controller/shop");
const isAuth = require("../middleware/is-auth");
const uploadImage = require("../middleware/uploadImage");
const router = express.Router();

router.post("/add-product", isAuth, uploadImage, shopController.addProduct);

router.get("/get-product/:productId", isAuth, shopController.getProduct);

// router.put("/", );

module.exports = router;
