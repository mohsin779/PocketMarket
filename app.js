const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const passport = require("passport");
const session = require("express-session");

require("dotenv").config();
require("./config/db")();
const app = express();

// app.use(multer().single("image"));
app.use(session({ secret: process.env.SUPER_KEY }));
app.use(passport.initialize());
app.use(passport.session());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
require("./config/morgan")(app);
require("./config/routes")(app);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Amazon Clone Working!");
});

const port = parseInt(process.env.PORT) || 5006;

app.listen(port, () => console.log(`server started at ${port}`));
