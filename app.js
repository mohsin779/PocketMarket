const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const passport = require("passport");
const expressSession = require("express-session");
const { Server } = require("socket.io");

require("dotenv").config();
require("./config/db")();
const app = express();

// app.use(multer().single("image"));
app.use(
  expressSession({
    secret: process.env.SUPER_KEY,
    resave: true,
    saveUninitialized: true,
    // setting the max age to longer duration
    // maxAge: 24 * 60 * 60 * 1000,
    // store: new MemoryStore(),
  })
);

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

const server = app.listen(port, () => console.log(`server started at ${port}`));
const io = new Server(server);

io.on("connection", () => {
  console.log("User connected");
  io.emit("connection", { message: "Client connected" });
});

app.set("socketio", io);

// app.listen(port, "0.0.0.0", () => console.log(`server started at ${port}`)); //to serve locally
