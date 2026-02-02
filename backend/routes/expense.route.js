import express from "express";
import Expense from "../models/Expense.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Load all active expenses
router.get("/load", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ isActive: true }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new expense
router.post("/insert", verifyToken, async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Soft Delete
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Expense.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;