const bodyParser = require("body-parser");

const superAdminRoutes = require("../routes/superAdmin");
const authRoutes = require("../routes/auth");

module.exports = function (app) {
  app.use(bodyParser.json()); //application/json

  app.use("/api/login", authRoutes);
  app.use("/api/admin", superAdminRoutes);
};
