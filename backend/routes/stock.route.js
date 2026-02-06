import express from "express";
import StockHistory from "../models/StockHistory.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/stock/history/:itemId
 * @desc    Get all stock movement logs for a specific item
 * @access  Private
 */
router.get("/history/:itemId", verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Fetch history, sorted by date (newest first)
    const history = await StockHistory.find({ itemId })
      .sort({ date: -1 })
      .lean();

    if (!history) {
      return res.status(404).json({ message: "No history found for this item" });
    }

    res.status(200).json(history);
  } catch (error) {
    console.error("Fetch Stock History Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @route   GET /api/stock/summary
 * @desc    Get global stock movements (Optional: for a dashboard)
 */
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const totalMovements = await StockHistory.find()
      .sort({ date: -1 })
      .limit(50);
    res.json(totalMovements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;