const bodyParser = require("body-parser");

const feedRoutes = require("../routes/feed");
const superAdminRoutes = require("../routes/superAdmin");

module.exports = function (app) {
  app.use(bodyParser.json()); //application/json

  app.use("/api/feed", feedRoutes);
  app.use("/api/admin", superAdminRoutes);
};
