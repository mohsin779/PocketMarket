const express = require("express");

const superAdminController = require("../controller/superAdmin");

// const {AdminValidations}=require('../models/admin')

const router = express.Router();

//Roles

router.get("/get-roles", superAdminController.getRoles);

//Shops
router.post("/create-shop", superAdminController.createEmployee);

router.get("/get-shops", superAdminController.getEmployees);

router.get("/get-single-shop/:shopId", superAdminController.getEmloyee);

router.put("/update-shop/:shopId", superAdminController.updateEmployee);

module.exports = router;
