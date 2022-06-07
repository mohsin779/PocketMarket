const express = require("express");

const commonConrtoller = require("../controller/commonController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/get-categories", isAuth, commonConrtoller.getCategories);

module.exports = router;
