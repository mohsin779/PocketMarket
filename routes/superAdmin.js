const express = require("express");

const superAdminController = require("../controller/superAdmin");
const isAuth = require("../middleware/is-auth");

// const {AdminValidations}=require('../models/admin')

const router = express.Router();

//Roles

router.get("/get-roles", superAdminController.getRoles);

//Shops
router.post("/create-shop", isAuth, superAdminController.createEmployee);

router.get("/get-shops", isAuth, superAdminController.getEmployees);

router.get("/get-single-shop/:shopId", isAuth, superAdminController.getEmloyee);

router.put("/update-shop/:shopId", isAuth, superAdminController.updateEmployee);

module.exports = router;
