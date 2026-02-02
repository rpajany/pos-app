import express from "express";
import Company from "../models/Company.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get company details
router.get("/", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOne();
    res.json(company || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update or Create company details
router.post("/update", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      {}, // Empty filter finds the first document
      req.body,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;