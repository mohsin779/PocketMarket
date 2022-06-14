const mongoose = require("mongoose");

const connetToDataBase = async () => {
  const result = await mongoose.connect(
    "mongodb+srv://Mohsin:9844@cluster0.k2jhm.mongodb.net/PocketMarket?retryWrites=true&w=majority"
  );
  if (result) {
    console.log("Connected to mongoDb...");
  } else {
    console.log("Failed to connect to mongodb...");
  }
};

module.exports = connetToDataBase;
