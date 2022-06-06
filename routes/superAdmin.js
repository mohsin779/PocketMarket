const express = require("express");

const superAdminController = require("../controller/superAdmin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//Roles

router.get("/get-roles", isAuth, superAdminController.getRoles);

//Shops
router.post("/create-shop", isAuth, superAdminController.createShop);

router.get("/get-shops", isAuth, superAdminController.getShops);

router.get("/get-single-shop/:shopId", isAuth, superAdminController.getShop);

router.put("/update-shop/:shopId", superAdminController.updateShop);

module.exports = router;
