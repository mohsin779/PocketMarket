const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");

const superAdminRoutes = require("../routes/superAdmin");
const authRoutes = require("../routes/auth");
const shopRoutes = require("../routes/shop");
const commonRoutes = require("../routes/commonRoutes");
const customerRoutes = require("../routes/customer");

module.exports = function (app) {
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(cors());

  app.use("/api", commonRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", superAdminRoutes);
  app.use("/api/shop", shopRoutes);
  app.use("/api/customer", customerRoutes);
};
