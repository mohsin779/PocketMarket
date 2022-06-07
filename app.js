const express = require("express");
require("dotenv").config();
require("./config/db")();
const path = require("path");
const app = express();
app.use(express.json());

require("./config/routes")(app);

// app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", (req, res) => {
  res.send("Amazon Clone Working!");
});

const port = process.env.PORT || 5006;

app.listen(port, () => console.log(`server started at ${port}`));
