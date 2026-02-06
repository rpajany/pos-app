import express from "express"
import mongoose from "mongoose";
import Purchase from "../models/Purchase.js"
import Item from "../models/Item.js"
import  {verifyToken} from '../middleware/auth.middleware.js';
import PurchasePayment from "../models/PurchasePayment.js";
import { addToSyncQueue } from "../services/syncService.js"
import StockHistory from "../models/StockHistory.js";

const router = express.Router()

const calculateItemGST = (itemPrice, quantity, gstPercentage) => {
  const baseAmount = itemPrice * quantity
  const gstAmount = (baseAmount * gstPercentage) / 100
  return gstAmount
}

router.get("/load", verifyToken, async (req, res) => {
  try {
    const purchases = await Purchase.find().populate("items.itemId")
    res.json(purchases)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})






// router.post("/insert", verifyToken, async (req, res) => {
//   // 1. Start the Session
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { items, ...purchaseData } = req.body;
//     const processedItems = [];

//     for (const item of items) {
//       const itemDoc = await Item.findById(item.itemId).session(session); // Pass session
//       if (!itemDoc) {
//         throw new Error(`Item ${item.itemId} not found`);
//       }
//       processedItems.push({ ...item }); // (Include your mapping logic here)
//     }

//     // 2. Save Purchase with session
//     const newPurchase = new Purchase({ ...purchaseData, items: processedItems });
//     const savedPurchase = await newPurchase.save({ session });

//     // 3. Save Payment with session
//     const initialPayment = new PurchasePayment({
//       purchaseId: savedPurchase._id,
//       purchaseNo: savedPurchase.purchaseNo,
//           supplierId: savedPurchase.supplierId,
//           supplierName: savedPurchase.supplierName,
//           totalPurchaseAmount: savedPurchase.totalAmount,
//           // If the customer paid something upfront during the sale
//           payments: [{
//             amount_paid: purchaseData.amountPaid || 0,
//             pay_type: purchaseData.paymentMethod || "Cash",
//             payment_date: new Date(),
//             note: "Initial payment during sale"
//           }]
//     });
//     await initialPayment.save({ session });

//     // 4. Update Stock with session
//     const stockUpdates = processedItems.map((item) => {
//       return Item.findByIdAndUpdate(
//         item.itemId,
//         { $inc: { stock: item.quantity } },
//         { session, new: true } // Pass session here
//       );
//     });
//     await Promise.all(stockUpdates);

//     // 5. If everything is successful, COMMIT the changes
//     await session.commitTransaction();
//     session.endSession();

//     res.status(201).json(savedPurchase);
//   } catch (error) {
//     // 6. If ANY step fails, ROLLBACK all changes
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error("Transaction Aborted. Error:", error);
//     res.status(400).json({ message: error.message });
//   }
// });

router.post("/insert", verifyToken, async (req, res) => {
  // 1. Start the Session for Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, ...purchaseData } = req.body;
    const processedItems = [];

    // 2. Validate Items and Map Data
    for (const item of items) {
      const itemDoc = await Item.findById(item.itemId).session(session);
      if (!itemDoc) {
        throw new Error(`Item ${item.itemId} not found`);
      }

      processedItems.push({
        itemId: item.itemId,
        itemName: item.itemName || itemDoc.name,
        hsnCode: item.hsnCode || itemDoc.hsnCode,
        quantity: Number(item.quantity),
        purchasePrice: Number(item.purchasePrice),
        discountPercentage: item.discountPercentage || 0,
        discountAmount: item.discountAmount || 0,
        taxableValue: item.taxableValue,
        gstPercentage: item.gstPercentage,
        gstAmount: item.gstAmount,
        cgst: item.cgst || 0,
        sgst: item.sgst || 0,
        igst: item.igst || 0,
        total: item.total,
      });
    }

    // 3. Save Purchase document
    const newPurchase = new Purchase({
      ...purchaseData,
      items: processedItems,
    });
    const savedPurchase = await newPurchase.save({ session });

    // 4. Save Initial Payment document
    const initialPayment = new PurchasePayment({
      purchaseId: savedPurchase._id,
      purchaseNo: savedPurchase.purchaseNo,
      supplierId: savedPurchase.supplierId,
      supplierName: savedPurchase.supplierName,
      totalPurchaseAmount: savedPurchase.totalAmount,
      payments: [{
        amount_paid: purchaseData.amountPaid || 0,
        pay_type: purchaseData.paymentMethod || "Cash",
        payment_date: new Date(),
        note: "Initial payment during purchase"
      }]
    });
    await initialPayment.save({ session });

    // 5. Update Stock AND Create Stock History for each item
    // We use a loop here to capture the Opening Stock for the History log
    for (const item of processedItems) {
      // Find current state to record history
      const currentItem = await Item.findById(item.itemId).session(session);
      const openingStock = currentItem.stock || 0;
      const closingStock = openingStock + item.quantity;

      // Update Item Stock
      await Item.findByIdAndUpdate(
        item.itemId,
        { $inc: { stock: item.quantity } },
        { session, new: true }
      );

      // Create Stock History Record
      const history = new StockHistory({
        itemId: item.itemId,
        itemName: item.itemName,
        type: "IN",
        transactionType: "PURCHASE",
        referenceId: savedPurchase._id,
        referenceNo: savedPurchase.purchaseNo,
        quantity: item.quantity,
        openingStock: openingStock,
        closingStock: closingStock,
        date: new Date()
      });
      await history.save({ session });
    }

    // 6. COMMIT all changes if everything passed
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedPurchase);
  } catch (error) {
    // 7. ROLLBACK if anything failed (No purchase, no payment, and no stock change will be saved)
    await session.abortTransaction();
    session.endSession();
    
    console.error("Purchase Transaction Failed:", error);
    res.status(400).json({ message: error.message });
  }
});



router.get("/:id", verifyToken, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate("items.itemId")
    if (!purchase) return res.status(404).json({ message: "Purchase not found" })
    res.json(purchase)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!purchase) return res.status(404).json({ message: "Purchase not found" })

    await addToSyncQueue("purchases", "update", req.params.id, req.body)

    res.json(purchase)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

export default router
