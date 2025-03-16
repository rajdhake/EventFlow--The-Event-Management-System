const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = require("../model/user");


// exports.createCustomer = async (req, res) => {
//   try {
//     const { username, email, password, role } = req.body;
//     const user = await Schema.findOne({ email: email });
//     if (user) {
//       return res.status(400).json({ message: "User already exists" });
//     }
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     const newUser = new Schema({
//       username,
//       email,
//       password: hashedPassword,
//       role,
//     });
//     await newUser.save();
//     res.status(201).json(newUser);
//   } catch (error) {
//     res.status(409).json({ message: error.message });
//   }
// };

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send("No user with that id");
    // check if the logged in user is the same as the user being updated
    if (req.user._id !== id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const updatedUser = await Schema.findByIdAndUpdate(id, req.body);
    res.status(202).json(updatedUser);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send("No user with that id");
    // check if the logged in user is admin
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await Schema.findByIdAndRemove(id);
    res.status(202).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send("No user with that id");
    if (req.user._id !== id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await Schema.findById(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
