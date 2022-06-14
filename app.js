const express = require("express");
const multer = require("multer");
require("dotenv").config();
require("./config/db")();
const app = express();

// app.use(multer().single("image"));

require("./config/morgan")(app);
require("./config/routes")(app);

// app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", (req, res) => {
  res.send("Amazon Clone Working!");
});

const port = parseInt(process.env.PORT) || 5006;
console.log(typeof process.env.MONGO_URL, process.env.MONGO_URL);
console.log(typeof process.env.SUPER_KEY, process.env.SUPER_KEY);

app.listen(port, () => console.log(`server started at ${port}`));
