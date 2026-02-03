import express from "express";
import Expense from "../models/Expense.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Load all active expenses
router.get("/load", verifyToken, async (req, res) => {
  try {
     const { startDate, endDate } = req.query;
   // Start with isActive: true as the base filter
    const query = { isActive: true };

    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
      };
    }

   // Now 'query' contains both isActive and the date range
    const expenses = await Expense.find(query).sort({ date: -1 });
    
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