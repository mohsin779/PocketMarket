const express = require("express");
const passport = require("passport");
require("../controller/googleAuth")(passport);
const authController = require("../controller/auth");
const router = express.Router();

router.get("/login/success", (req, res) => {
  console.log("login success");
  if (req.customer) {
    res.status(200).json({
      success: true,
      message: "successfull",
      customer: req.customer,
    });
  }
});

router.post("/shop/login", authController.shopLogin);
router.post("/admin/login", authController.adminLogin);
router.post("/customer/signup", authController.customerSignup);
router.post("/customer/login", authController.customerLogin);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "auth/customer/login",
  }),
  (req, res) => {
    // res.redirect("/login/success");
  }
);
module.exports = router;
