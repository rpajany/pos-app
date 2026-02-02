import express from "express";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { addToSyncQueue } from "../services/syncService.js";
import StockLedger from "../models/StockLedger.js";

const router = express.Router();

router.get("/load", verifyToken, async (req, res) => {
  try {
    const items = await Item.find({ isActive: true });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.post("/insert", verifyToken, async (req, res) => {
//   try {
//     const newItem = new Item(req.body);
//   const savedItem = await newItem.save();

//     // Log the initial ledger stock entry
//     const ledgerEntry = new StockLedger({
//       itemId: savedItem._id,
//       changeQuantity: savedItem.stock,
//       finalStock: savedItem.stock,
//       reason: "Initial Entry",
//     });
//     await ledgerEntry.save();

//     await addToSyncQueue("items", "create", savedItem._id.toString(), req.body);

//     res.status(201).json(savedItem);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

router.post("/insert", verifyToken, async (req, res) => {
  // Start a Session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Save the Item
    const newItem = new Item(req.body);
    const savedItem = await newItem.save({ session });

    // 2. Log to Stock Ledger
    const ledgerEntry = new StockLedger({
      itemId: savedItem._id,
      changeQuantity: savedItem.stock || 0,
      finalStock: savedItem.stock || 0,
      reason: "Initial Entry",
    });
    await ledgerEntry.save({ session });

    // 3. Add to Sync Queue
    await addToSyncQueue("items", "create", savedItem._id.toString(), req.body);

    // If everything is successful, COMMIT the changes to the database
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedItem);
  } catch (error) {
    // If ANY step fails, UNDO everything done in this session
    await session.abortTransaction();
    session.endSession();
    
    res.status(400).json({ message: error.message });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    // 1. Find the item BEFORE updating to get the old stock
    const oldItem = await Item.findById(req.params.id);
    if (!oldItem) return res.status(404).json({ message: "Item not found" });

    // 2. Perform the update
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedItem) return res.status(404).json({ message: "Item not found" });

    // 3. Calculate the difference ONLY if stock was part of the update
    // If stock wasn't changed, we don't necessarily need a ledger entry, 
    // but if it was, we need the delta.
    const oldStock = oldItem.stock || 0;
    const newStock = updatedItem.stock || 0;
    const stockChange = newStock - oldStock;

    if (stockChange !== 0) {
      const ledgerEntry = new StockLedger({
        itemId: updatedItem._id,
        changeQuantity: stockChange, // This will be +5 or -5
        finalStock: newStock,        // This will be 55
        reason: req.body.reason || "Manual Update" // Good to allow a reason from frontend
      });
      await ledgerEntry.save();
    }

    await addToSyncQueue("items", "update", req.params.id, req.body);

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// router.delete("/:id", verifyToken, async (req, res) => {
//   try {
//     const item = await Item.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
//     if (!item) return res.status(404).json({ message: "Item not found" })

//     await addToSyncQueue("items", "delete", req.params.id, {})

//     res.json({ message: "Item deleted successfully" })
//   } catch (error) {
//     res.status(500).json({ message: error.message })
//   }
// })

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // We don't use .findByIdAndDelete(). We use .findByIdAndUpdate()
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: "Item not found" });

    // Sync the deletion to other stations/offline database
    await addToSyncQueue("items", "delete", req.params.id, { isActive: false });

    res.json({ message: "Item deactivated successfully", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/barcode/:barcode", verifyToken, async (req, res) => {
  try {
    const item = await Item.findOne({
      barcode: req.params.barcode,
      isActive: true,
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/bulk-insert", verifyToken, async (req, res) => {
  try {
    const { items } = req.body;

    // Optional: Validate data before insertion
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    const insertedItems = await Item.insertMany(items);

    // Add to sync queue if needed
    await addToSyncQueue("items", "bulk-create", "multiple", {
      count: insertedItems.length,
    });

    res.status(201).json({
      message: "Bulk import successful",
      count: insertedItems.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during bulk import", error: error.message });
  }
});

router.get("/ledger/:itemId", verifyToken, async (req, res) => {
  try {
    // Find logs for this specific item, sorted by newest first
    const logs = await StockLedger.find({ itemId: req.params.itemId })
      .sort({ timestamp: -1 })
      .limit(50); // Show last 50 changes
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
