require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const { SuperAdmin } = require("../models/superAdmin");
const { Role } = require("../models/roles");
const { Category } = require("../models/category");

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
  const categories = ["Electronics", "Kitchen"];
  const category_images = [
    "uploads/image_0000000000000.jpg",
    "uploads/image_0000000000001.jpg",
  ];

  roles.map(async (item, index) => {
    const role = new Role({ name: item });
    await role.save();
  });

  categories.map(async (name, index) => {
    const category = new Category({
      name: name,
      imageUrl: category_images[index],
    });

    await category.save();
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
