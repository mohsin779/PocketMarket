const express = require("express");
const router = express.Router();

const shopController = require("../controller/shop");
const isAuth = require("../middleware/is-auth");
const imageUpload = require("../config/multerImage")();
const fileUpload = require("../config/multerFile")();

router.post(
  "/add-product",
  isAuth,
  imageUpload.single("image"),
  shopController.addProduct
);

router.delete(
  "/delete-product/:productId",
  isAuth,
  shopController.deleteProduct
);

router.put(
  "/update-product/:productId",
  isAuth,
  imageUpload.single("image"),
  shopController.updateProduct
);

router.post("/update-shop", isAuth, shopController.updateShop);
router.get("/myShop", isAuth, shopController.myShop);
router.get("/get-product/:productId", isAuth, shopController.getProduct);
router.get("/myProducts", isAuth, shopController.myProducts);
router.get("/orders", isAuth, shopController.orders);
router.put(
  "/update-order-status/:orderId",
  isAuth,
  shopController.updateOrderStatus
);
router.post(
  "/upload-products",
  fileUpload.single("excel"),
  isAuth,
  shopController.uploadProducts
);

router.get("/download-products", isAuth, shopController.downloadProductsList);
router.get("/send-code", shopController.sendEmail);
router.put("/reset-password", shopController.resetPassword);

module.exports = router;
