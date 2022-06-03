const bcrypt = require("bcryptjs");
const { Role } = require("../models/roles");
const { Shop } = require("../models/shop");

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.status(200).send({ roles: roles });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
exports.getEmployees = async (req, res, next) => {
  try {
    const shops = await Shop.find().select("-password").populate("role");
    res.status(200).send({ shops: shops });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    const existingShop = await Shop.findOne({ email: email });
    if (existingShop) {
      return res
        .status(401)
        .send({ error: "A shop with this email already exists" });
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const shop = new Shop({
      name: name,
      email: email,
      password: hashedPw,
      role: role,
    });
    await shop.save();

    const createdShop = await Shop.findById({ _id: shop._id })
      .select("-password")
      .populate("role");

    res.status(201).json({
      message: "Admin created!",
      shop: createdShop,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getEmloyee = async (req, res, next) => {
  const employeeId = req.params.employeeId;
  const employee = await Admin.findById(employeeId);
  try {
    if (!employee) {
      const error = new Error("Could not find Employee.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Employee fetched.", employee: employee });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  const employeeId = req.params.employeeId;

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  try {
    const employee = await Admin.findById(employeeId);
    if (!employee) {
      const error = new Error("Could not find Employee.");
      error.statusCode = 404;
      throw error;
    }
    // if (employee._id !== req.userId) {
    //   const error = new Error('Not authorized!');
    //   error.statusCode = 403;
    //   throw error;
    // }
    employee.name = name;
    employee.email = email;
    if (password) {
      employee.password = password;
    }
    employee.role = role;
    const result = await employee.save();
    res.status(200).json({ message: "Employee updated!", employee: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
