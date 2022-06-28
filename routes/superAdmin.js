const express = require("express");
const multer = require("multer");

const superAdminController = require("../controller/superAdmin");
const isAuth = require("../middleware/is-auth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const imageUpload = require("../config/multerImage")();
const fileUpload = require("../config/multerFile")();
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
  fileUpload.single("excel"),
  isAuth,
  isSuperAdmin,
  superAdminController.uploadCategories
);

router.get(
  "/download-categories",
  isAuth,
  isSuperAdmin,
  superAdminController.downloadCategoriesList
);

module.exports = router;
