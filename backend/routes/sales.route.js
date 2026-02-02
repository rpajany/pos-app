import express from "express";
import Sale from "../models/Sale.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import InvoiceCounter from "../models/InvoiceCounter.js";
import SalesPayment from "../models/SalesPayment.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { addToSyncQueue } from "../services/syncService.js";

const router = express.Router();

const calculateItemGST = (itemPrice, quantity, gstPercentage) => {
  const baseAmount = itemPrice * quantity;
  const gstAmount = (baseAmount * gstPercentage) / 100;
  return gstAmount;
};

const generateInvoiceNumber = async () => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const counterDoc = await InvoiceCounter.findOneAndUpdate(
    { date: today },
    { $inc: { counter: 1 }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  );
  const invoiceNo = `INV-${String(counterDoc.counter).padStart(
    3,
    "0"
  )}-${today}`;
  return invoiceNo;
};

router.get("/load", verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};

    // If dates are provided, add them to the query object
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        // To include the entire "to" day, set it to the very end of that day
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const sales = await Sale.find(query)
      // .populate("customerId")
      .populate("customerId", "name phone gstNumber") // Populate specific fields
      // .populate("items.itemId")
      
      .populate("items.itemId", "itemName")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.post("/insert", verifyToken, async (req, res) => {
//    try {
//     const { items, discount = 0, customerId, paymentMethod = "cash", ...saleData } = req.body

//     const invoiceNo = await generateInvoiceNumber()

//     let subtotal = 0
//     let totalTax = 0
//     const processedItems = []

//     for (const item of items) {
//       const itemDoc = await Item.findById(item.itemId)
//       if (!itemDoc) {
//         return res.status(404).json({ message: `Item ${item.itemId} not found` })
//       }

//       const gstPercentage = item.gstPercentage || itemDoc.gstPercentage || 18
//       const itemDiscount = item.discount || 0
//       const itemSubtotal = item.sellingPrice * item.quantity - itemDiscount
//       const gstAmount = calculateItemGST(itemSubtotal, 1, gstPercentage)

//       subtotal += itemSubtotal
//       totalTax += gstAmount

//       processedItems.push({
//         itemId: item.itemId,
//         quantity: item.quantity,
//         sellingPrice: item.sellingPrice,
//         discount: itemDiscount,
//         gstPercentage,
//         gstAmount: Math.round(gstAmount * 100) / 100,
//         total: Math.round((itemSubtotal + gstAmount) * 100) / 100,
//       })
//     }

//     const newSale = new Sale({
//       ...saleData,
//       invoiceNo,
//       items: processedItems,
//       customerId,
//       paymentMethod,
//       subtotal: Math.round(subtotal * 100) / 100,
//       totalTax: Math.round(totalTax * 100) / 100,
//       discount,
//       totalAmount: Math.round((subtotal + totalTax - discount) * 100) / 100,
//     })

//     await newSale.save()

//     await addToSyncQueue("sales", "create", newSale._id.toString(), {
//       ...saleData,
//       invoiceNo,
//       items: processedItems,
//       customerId,
//       paymentMethod,
//       subtotal: newSale.subtotal,
//       totalTax: newSale.totalTax,
//       discount,
//       totalAmount: newSale.totalAmount,
//     })

//     // Update stock and customer credit
//     for (const item of processedItems) {
//       await Item.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } })
//     }

//     if (customerId && paymentMethod === "credit") {
//       await Customer.findByIdAndUpdate(customerId, { $inc: { currentCredit: newSale.totalAmount } })
//     }

//     res.status(201).json(newSale)
//   } catch (error) {
//     res.status(400).json({ message: error.message })
//   }
// });

router.post("/insert", verifyToken, async (req, res) => {
  try {
    const { formData } = req.body;

    // 1. Generate unique Invoice Number
    const invoiceNo = await generateInvoiceNumber();

    // 2. Prepare Sale document using Form Data
    const newSale = new Sale({
      ...formData, // Spreading formData captures subtotal, totalAmount, etc.
      invoiceNo,
      status: formData.status || "completed",
    });

    // 3. Save Sale to Database
    const savedSale = await newSale.save();

    // 2. Automatically create the SalesPayment record for this invoice
    const initialPayment = new SalesPayment({
      invoiceId: savedSale._id,
      invoiceNo: savedSale.invoiceNo,
      customerId: savedSale.customerId,
      customerName: savedSale.customerName,
      totalInvoiceAmount: savedSale.totalAmount,
      // If the customer paid something upfront during the sale
      payments: [{
        amount_paid: formData.totalReceived || 0,
        pay_type: formData.cashReceived? "Cash" : "UPI",
        payment_date: new Date(),
        note: "Initial payment during sale"
      }]
    });

    await initialPayment.save(); 
    // Note: The pre-save middleware we wrote earlier will 
    // automatically calculate balanceAmount and paymentStatus here.

    // 4. Update Stock for each item sold
    // We loop through the items array from the request
    const stockUpdates = formData.items.map((item) => {
      return Item.findByIdAndUpdate(
        item.itemId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    });
    await Promise.all(stockUpdates);

    // 5. Update Customer Loyalty Points & Update Customer Credit if paymentMethod is 'credit'
    // Or if there's a balance remaining in a partial credit payment
    // if (formData.customerId && formData.paymentMethod === "credit") {
    //   await Customer.findByIdAndUpdate(formData.customerId, {
    //     $inc: { currentCredit: formData.totalAmount , loyaltyPoints: formData.pointsEarned}
    //   });
    // } else if (formData.customerId && formData.balanceChange < 0) {
    //   // Optional: If balanceChange is negative, it implies remaining debt
    //   await Customer.findByIdAndUpdate(formData.customerId, {
    //     $inc: { currentCredit: Math.abs(formData.balanceChange) },
    //   });
    // }

    // 5. Update Customer Loyalty Points & Credit Balance
    if (formData.customerId) {
      // A. ALWAYS Update Loyalty Points (if points were earned)
      if (formData.pointsEarned > 0) {
        await Customer.findByIdAndUpdate(formData.customerId, {
          $inc: { loyaltyPoints: formData.pointsEarned },
        });
      }

      // B. Update Credit Balance ONLY if applicable
      if (formData.paymentMethod === "credit") {
        await Customer.findByIdAndUpdate(formData.customerId, {
          $inc: { currentCredit: formData.totalAmount },
        });
      } else if (formData.balanceChange < 0) {
        // If they paid partially, add the remaining debt to credit
        await Customer.findByIdAndUpdate(formData.customerId, {
          $inc: { currentCredit: Math.abs(formData.balanceChange) },
        });
      }
    }

    // 6. Add to Sync Queue for offline/external synchronization
    // Passing the savedSale object to ensure data consistency
    await addToSyncQueue("sales", "create", savedSale._id.toString(), {
      ...savedSale.toObject(),
    });

    // 7. Send Success Response
    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      sale: savedSale,
    });
  } catch (error) {
    console.error("Sale Insertion Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("customerId")
      .populate("items.itemId");
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    await addToSyncQueue("sales", "update", req.params.id, req.body);

    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
