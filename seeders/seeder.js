require("dotenv").config({ path: "../.env" });

const { Role } = require("../models/roles");

const mongoose = require("mongoose");
const { SuperAdmin } = require("../models/superAdmin");
const bcryptjs = require("bcryptjs");

const seeder = async () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB..."))
    .catch((err) => console.error("Could not connect to MongoDb... ", err));

  const roles = ["Super admin", "Shop"];

  roles.map(async (item, index) => {
    const role = new Role({ name: item });

    await role.save();
  });

  const adminRole = await Role.findOne({ name: "Super admin" });

  const hashedPw = await bcryptjs.hash("12345678", 12);
  const superAdmin = new SuperAdmin({
    name: "The Hexaa",
    email: "admin@admin.com",
    password: hashedPw,
    role: adminRole._id,
  });

  await superAdmin.save();

  console.log("Done!");
  mongoose.disconnect();
};

seeder();
