const express = require("express");
require("dotenv").config();
require("./config/db")();

const app = express();
require("./config/routes")(app);

app.get("/", (req, res) => {
  res.send("Amazon Clone Working!");
});

const port = process.env.PORT || 5006;

app.listen(port, () => console.log(`server started at ${port}`));
