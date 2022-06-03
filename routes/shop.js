const express = require("express");

const adminController = require("../controller/superAdmin");

// const {AdminValidations}=require('../models/admin')

const router = express.Router();

router.post("/", adminController.createEmployee);

router.get("/employees", adminController.getEmployees);

router.get("/employee/:employeeId", adminController.getEmloyee);

router.put("/employee/:employeeId", adminController.updateEmployee);

module.exports = router;
