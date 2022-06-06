const express = require("express");

const superAdminController = require("../controller/superAdmin");
const isAuth = require("../middleware/is-auth");
const isSuperAdmin = require("../middleware/isSuperAdmin");

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

router.get(
  "/get-single-shop/:shopId",
  isAuth,
  isSuperAdmin,
  superAdminController.getShop
);

router.put(
  "/update-shop/:shopId",
  isAuth,
  isSuperAdmin,
  superAdminController.updateShop
);

module.exports = router;
