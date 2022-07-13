const Sequelize = require("sequelize"); //npm install --save sequelize

// const Sequelize =new Sequelize('databaseName','userName','Password');
const sequelize = new Sequelize("amazon_clone", "root", "", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
