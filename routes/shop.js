const express = require("express");
const router = express.Router();

const shopController = require("../controller/shop");
const isAuth = require("../middleware/is-auth");
const imageUpload = require("../config/multerImage")();

router.post(
  "/add-product",
  isAuth,
  imageUpload.single("image"),
  shopController.addProduct
);

router.post("/delete-product/:productId", isAuth, shopController.deleteProduct);

router.put(
  "/update-product/:productId",
  isAuth,
  imageUpload.single("image"),
  shopController.updateProduct
);

router.post("/update-shop", isAuth, shopController.updateShop);
router.get("/myShop", isAuth, shopController.myShop);

module.exports = router;
