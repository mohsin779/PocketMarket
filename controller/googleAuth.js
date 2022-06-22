require("dotenv").config();
var GoogleStrategy = require("passport-google-oauth20").Strategy;
const { custom } = require("joi");
const { Customer } = require("../models/customer");

module.exports = async function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8080/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log("profile: ", profile);
        const existingCustomer = await Customer.findOne({
          email: profile.emails[0].value,
        });
        if (existingCustomer) {
          console.log("Customer already exist: ", existingCustomer);
          return done(null, existingCustomer);
        } else {
          const customer = new Customer({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: null,
            address: null,
            phoneNumber: null,
          });
          const result = await customer.save();
          return done(null, customer);
          //   const token = customer.genAuthToken();
          //   res.status(200).json({ token: token });
        }

        // find if a customer exist with this email or not
        // Customer.findOne({ email: profile.emails[0].value }).then((data) => {
        //   if (data) {
        //     // customer exists
        //     // update data
        //     // I am skipping that part here, may Update Later
        //     // return done(null, data);
        //     return "data = " + data;
        //   } else {
        //     // create a customer
        //     Customer({
        //       name: profile.displayName,
        //       email: profile.emails[0].value,
        //       googleId: profile.id,
        //       password: null,
        //       address: "Lahore",
        //       phone: "309812039",
        //       provider: "google",
        //       isVerified: true,
        //     }).save(function (err, data) {
        //       return done(null, data);
        //     });
        //   }
        // });
      }
    )
  );
  passport.serializeUser(function (Customer, done) {
    done(null, Customer);
  });

  passport.deserializeUser(function (id, done) {
    Customer.findById(id, function (err, Customer) {
      done(err, Customer);
    });
  });
};
