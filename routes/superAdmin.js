const express = require("express");

const superAdminController = require("../controller/superAdmin");
const isAuth = require("../middleware/is-auth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const imageUpload = require("../config/multerImage")();
// const { Category } = require("../models/category");
const router = express.Router();

//Roles

router.get("/get-roles", isAuth, isSuperAdmin, superAdminController.getRoles);

//Shops
router.post(
  "/create-shop",
  isAuth,
  isSuperAdmin,
  superAdminController.createShop
);

router.get("/get-shops", isAuth, isSuperAdmin, superAdminController.getShops);

router.put(
  "/update-shop/:shopId",
  isAuth,
  isSuperAdmin,
  superAdminController.updateShop
);

router.post(
  "/add-category",
  isAuth,
  isSuperAdmin,
  imageUpload.single("image"),
  superAdminController.addCategory
);

router.get(
  "/get-update-requests",
  isAuth,
  isSuperAdmin,
  superAdminController.getUpdateRequests
);

router.delete(
  "/delete-shop/:shopId",
  isAuth,
  isSuperAdmin,
  superAdminController.deleteShop
);
router.delete(
  "/delete-request/:requestId",
  isAuth,
  isSuperAdmin,
  superAdminController.deleteUpdateRequest
);

router.post(
  "/upload-categories",
  imageUpload.single("excel"),
  isAuth,
  isSuperAdmin,
  superAdminController.uploadCategories
);

module.exports = router;
