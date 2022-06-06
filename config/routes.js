const bodyParser = require("body-parser");

const superAdminRoutes = require("../routes/superAdmin");
const authRoutes = require("../routes/auth");

module.exports = function (app) {
  app.use(bodyParser.json());

  app.use("/api", authRoutes);
  app.use("/api/admin", superAdminRoutes);
};
