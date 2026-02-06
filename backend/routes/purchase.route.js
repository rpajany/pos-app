import express from "express"
import mongoose from "mongoose";
import Purchase from "../models/Purchase.js"
import Item from "../models/Item.js"
import  {verifyToken} from '../middleware/auth.middleware.js';
import PurchasePayment from "../models/PurchasePayment.js";
import { addToSyncQueue } from "../services/syncService.js"

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
//   try {
//     const { items, ...purchaseData } = req.body

//     let subtotal = 0
//     let totalTax = 0
//     const processedItems = []

//     for (const item of items) {
//       const itemDoc = await Item.findById(item.itemId)
//       if (!itemDoc) {
//         return res.status(404).json({ message: `Item ${item.itemId} not found` })
//       }

//       const gstPercentage = item.gstPercentage || itemDoc.gstPercentage || 18
//       const itemTotal = item.purchasePrice * item.quantity
//       const gstAmount = calculateItemGST(item.purchasePrice, item.quantity, gstPercentage)

//       subtotal += itemTotal
//       totalTax += gstAmount

//       processedItems.push({
//         itemId: item.itemId,
//         quantity: item.quantity,
//         purchasePrice: item.purchasePrice,
//         gstPercentage,
//         gstAmount: Math.round(gstAmount * 100) / 100,
//         total: Math.round((itemTotal + gstAmount) * 100) / 100,
//       })
//     }

//     const newPurchase = new Purchase({
//       ...purchaseData,
//       items: processedItems,
//       subtotal: Math.round(subtotal * 100) / 100,
//       totalTax: Math.round(totalTax * 100) / 100,
//       totalAmount: Math.round((subtotal + totalTax - (purchaseData.discount || 0)) * 100) / 100,
//     })

//     await newPurchase.save()

//     await addToSyncQueue("purchases", "create", newPurchase._id.toString(), {
//       ...purchaseData,
//       items: processedItems,
//       subtotal: newPurchase.subtotal,
//       totalTax: newPurchase.totalTax,
//       totalAmount: newPurchase.totalAmount,
//     })

//     // Update stock
//     for (const item of processedItems) {
//       await Item.findByIdAndUpdate(item.itemId, { $inc: { stock: item.quantity } })
//     }

//     res.status(201).json(newPurchase)
//   } catch (error) {
//     res.status(400).json({ message: error.message })
//   }
// })


// router.post("/insert", verifyToken, async (req, res) => {
  
//   try {

//     const { items, ...purchaseData } = req.body;
//     const processedItems = [];

//     for (const item of items) {
//       const itemDoc = await Item.findById(item.itemId);
//       if (!itemDoc) {
//         return res.status(404).json({ message: `Item ${item.itemId} not found` });
//       }

//       // Add the missing fields that your Mongoose schema requires
//       processedItems.push({
//         itemId: item.itemId,
//         itemName: item.itemName, // Snapshot name
//         hsnCode: item.hsnCode,
//         quantity: item.quantity,
//         purchasePrice: item.purchasePrice,
//         discountPercentage: item.discountPercentage || 0,
//         discountAmount: item.discountAmount || 0,
//         taxableValue: item.taxableValue, // CRITICAL: This was missing!
//         gstPercentage: item.gstPercentage,
//         gstAmount: item.gstAmount,
//         cgst: item.cgst || 0,
//         sgst: item.sgst || 0,
//         igst: item.igst || 0,
//         total: item.total,
//       });
//     }

//     const newPurchase = new Purchase({
//       ...purchaseData,
//       items: processedItems,
//       // Use the totals calculated by your frontend for consistency
//       totalTaxableValue: purchaseData.totalTaxableValue,
//       totalCGST: purchaseData.totalCGST,
//       totalSGST: purchaseData.totalSGST,
//       totalIGST: purchaseData.totalIGST,
//       totalTax: purchaseData.totalTax,
//       totalDiscount: purchaseData.totalDiscount,
//       totalAmount: purchaseData.totalAmount,
//     });

//     const savedPurchase = await newPurchase.save();

//     // 2. Automatically create the SalesPayment record for this invoice
//         const initialPayment = new PurchasePayment({
//           purchaseId: savedPurchase._id,
//           purchaseNo: savedPurchase.purchaseNo,
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
//         });
    
//         await initialPayment.save(); 

//     // Sync Queue (Optional: ensure data matches the saved document)
//     await addToSyncQueue("purchases", "create", newPurchase._id.toString(), newPurchase);

//     // Update stock - Using $inc to ensure atomic updates
//     for (const item of processedItems) {
//       // Check if your field is 'stock' or 'stockQty' based on your Item Master
//       await Item.findByIdAndUpdate(item.itemId, { 
//         $inc: { stock: item.quantity } // Matches your itemSchema
//       });
//     }

//     res.status(201).json(newPurchase);
//   } catch (error) {
//     console.error("Purchase Error:", error); // Helpful for debugging
//     res.status(400).json({ message: error.message });
//   }
// });

router.post("/insert", verifyToken, async (req, res) => {
  // 1. Start the Session
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

    const { items, ...purchaseData } = req.body;
    const processedItems = [];

    for (const item of items) {
      const itemDoc = await Item.findById(item.itemId);
      if (!itemDoc) {
        return res.status(404).json({ message: `Item ${item.itemId} not found` });
      }

      // Add the missing fields that your Mongoose schema requires
      processedItems.push({
        itemId: item.itemId,
        itemName: item.itemName, // Snapshot name
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        discountPercentage: item.discountPercentage || 0,
        discountAmount: item.discountAmount || 0,
        taxableValue: item.taxableValue, // CRITICAL: This was missing!
        gstPercentage: item.gstPercentage,
        gstAmount: item.gstAmount,
        cgst: item.cgst || 0,
        sgst: item.sgst || 0,
        igst: item.igst || 0,
        total: item.total,
      });
    }

    const newPurchase = new Purchase({
      ...purchaseData,
      items: processedItems,
      // Use the totals calculated by your frontend for consistency
      totalTaxableValue: purchaseData.totalTaxableValue,
      totalCGST: purchaseData.totalCGST,
      totalSGST: purchaseData.totalSGST,
      totalIGST: purchaseData.totalIGST,
      totalTax: purchaseData.totalTax,
      totalDiscount: purchaseData.totalDiscount,
      totalAmount: purchaseData.totalAmount,
    });

    const savedPurchase = await newPurchase.save();

    // 2. Automatically create the SalesPayment record for this invoice
        const initialPayment = new PurchasePayment({
          purchaseId: savedPurchase._id,
          purchaseNo: savedPurchase.purchaseNo,
          supplierId: savedPurchase.supplierId,
          supplierName: savedPurchase.supplierName,
          totalPurchaseAmount: savedPurchase.totalAmount,
          // If the customer paid something upfront during the sale
          payments: [{
            amount_paid: purchaseData.amountPaid || 0,
            pay_type: purchaseData.paymentMethod || "Cash",
            payment_date: new Date(),
            note: "Initial payment during sale"
          }]
        });
    
        await initialPayment.save(); 

    // Sync Queue (Optional: ensure data matches the saved document)
    await addToSyncQueue("purchases", "create", newPurchase._id.toString(), newPurchase);

    // Update stock - Using $inc to ensure atomic updates
    for (const item of processedItems) {
      // Check if your field is 'stock' or 'stockQty' based on your Item Master
      await Item.findByIdAndUpdate(item.itemId, { 
        $inc: { stock: item.quantity } // Matches your itemSchema
      });
    }

    res.status(201).json(newPurchase);
  } catch (error) {
    console.error("Purchase Error:", error); // Helpful for debugging
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
