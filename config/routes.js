const bodyParser = require("body-parser");

const superAdminRoutes = require("../routes/superAdmin");
const authRoutes = require("../routes/auth");
const shopRoutes = require("../routes/shop");
const commonRoutes = require("../routes/commonRoutes");

module.exports = function (app) {
  app.use(bodyParser.json());

  app.use("/api", commonRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", superAdminRoutes);
  app.use("/api/shop", shopRoutes);
};
