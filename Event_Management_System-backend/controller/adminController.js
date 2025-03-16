const express = require("express");
const Schema = require("../model/user");

exports.getAdmins = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const admin = await Schema.find({ role: "admin" });
    res.status(200).json(admin);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const admin = req.body;
    const newAdmin = new Schema(admin);
    await newAdmin.save();
    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!Schema.Types.ObjectId.isValid(id))
      return res.status(404).send("No admin with that id");
    const updatedAdmin = await Schema.findByIdAndUpdate(id, req.body);
    res.status(202).json(updatedAdmin);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!Schema.Types.ObjectId.isValid(id))
      return res.status(404).send("No admin with that id");
    await Schema.findByIdAndRemove(id);
    res.status(202).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!Schema.Types.ObjectId.isValid(id))
      return res.status(404).send("No admin with that id");
    const admin = await Schema.findById(id);
    res.status(200).json(admin);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getAdminByEmail = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { email } = req.params;
    const admin = await Schema.findOne({ email: email });
    if (!admin) {
      return res.status(404).send("No admin with that email");
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getAdminByUsername = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { username } = req.params;
    const admin = await Schema.findOne({ username: username });
    if (!admin) {
      return res.status(404).send("No admin with that username");
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const users = await Schema.find({ role: "customer" });
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getVenueOwners = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const users = await Schema.find({ role: "venueOwner" });
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getEventPlanners = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const users = await Schema.find({ role: "eventPlanner" });
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!Schema.Types.ObjectId.isValid(id))
      return res.status(404).send("No user with that id");
    const user = await Schema.findById(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { email } = req.params;
    const user = await Schema.findOne({ email: email });
    if (!user) {
      return res.status(404).send("No user with that email");
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const users = await Schema.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};



exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    if (!Schema.Types.ObjectId.isValid(id))
      return res.status(404).send("No user with that id");
    await Schema.findByIdAndRemove(id);
    res.status(202).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};