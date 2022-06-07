const { Category } = require("../models/category");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).send({ categories: categories });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
