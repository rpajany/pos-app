import express from "express";
import Supplier from "../models/Supplier.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get All Suppliers
router.get("/", verifyToken, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Supplier
router.post("/", verifyToken, async (req, res) => {
  try {
    const newSupplier = new Supplier(req.body);
    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Supplier
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Supplier
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "Supplier Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;