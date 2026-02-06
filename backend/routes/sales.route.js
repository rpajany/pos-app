import express from "express";
import Sale from "../models/Sale.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import InvoiceCounter from "../models/InvoiceCounter.js";
import SalesPayment from "../models/SalesPayment.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { addToSyncQueue } from "../services/syncService.js";
import StockHistory from "../models/StockHistory.js";

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
//   try {
//     const { formData } = req.body;

//     // 1. Generate unique Invoice Number
//     const invoiceNo = await generateInvoiceNumber();

//     // 2. Prepare Sale document using Form Data
//     const newSale = new Sale({
//       ...formData, // Spreading formData captures subtotal, totalAmount, etc.
//       invoiceNo,
//       status: formData.status || "completed",
//     });

//     // 3. Save Sale to Database
//     const savedSale = await newSale.save();

//     // 2. Automatically create the SalesPayment record for this invoice
//     const initialPayment = new SalesPayment({
//       invoiceId: savedSale._id,
//       invoiceNo: savedSale.invoiceNo,
//       customerId: savedSale.customerId,
//       customerName: savedSale.customerName,
//       totalInvoiceAmount: savedSale.totalAmount,
//       // If the customer paid something upfront during the sale
//       payments: [{
//         amount_paid: formData.totalReceived || 0,
//         pay_type: formData.cashReceived? "Cash" : "UPI",
//         payment_date: new Date(),
//         note: "Initial payment during sale"
//       }]
//     });

//     await initialPayment.save(); 
//     // Note: The pre-save middleware we wrote earlier will 
//     // automatically calculate balanceAmount and paymentStatus here.

//     // 4. Update Stock for each item sold
//     // We loop through the items array from the request
//     const stockUpdates = formData.items.map((item) => {
//       return Item.findByIdAndUpdate(
//         item.itemId,
//         { $inc: { stock: -item.quantity } },
//         { new: true }
//       );
//     });
//     await Promise.all(stockUpdates);

//     // 5. Update Customer Loyalty Points & Update Customer Credit if paymentMethod is 'credit'
//     // Or if there's a balance remaining in a partial credit payment
//     // if (formData.customerId && formData.paymentMethod === "credit") {
//     //   await Customer.findByIdAndUpdate(formData.customerId, {
//     //     $inc: { currentCredit: formData.totalAmount , loyaltyPoints: formData.pointsEarned}
//     //   });
//     // } else if (formData.customerId && formData.balanceChange < 0) {
//     //   // Optional: If balanceChange is negative, it implies remaining debt
//     //   await Customer.findByIdAndUpdate(formData.customerId, {
//     //     $inc: { currentCredit: Math.abs(formData.balanceChange) },
//     //   });
//     // }

//     // 5. Update Customer Loyalty Points & Credit Balance
//     if (formData.customerId) {
//       // A. ALWAYS Update Loyalty Points (if points were earned)
//       if (formData.pointsEarned > 0) {
//         await Customer.findByIdAndUpdate(formData.customerId, {
//           $inc: { loyaltyPoints: formData.pointsEarned },
//         });
//       }

//       // B. Update Credit Balance ONLY if applicable
//       if (formData.paymentMethod === "credit") {
//         await Customer.findByIdAndUpdate(formData.customerId, {
//           $inc: { currentCredit: formData.totalAmount },
//         });
//       } else if (formData.balanceChange < 0) {
//         // If they paid partially, add the remaining debt to credit
//         await Customer.findByIdAndUpdate(formData.customerId, {
//           $inc: { currentCredit: Math.abs(formData.balanceChange) },
//         });
//       }
//     }

//     // 6. Add to Sync Queue for offline/external synchronization
//     // Passing the savedSale object to ensure data consistency
//     await addToSyncQueue("sales", "create", savedSale._id.toString(), {
//       ...savedSale.toObject(),
//     });

//     // 7. Send Success Response
//     res.status(201).json({
//       success: true,
//       message: "Sale completed successfully",
//       sale: savedSale,
//     });
//   } catch (error) {
//     console.error("Sale Insertion Error:", error);
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

router.post("/insert", verifyToken, async (req, res) => {
  // 1. Start the Session for Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, ...saleData } = req.body;
    const processedItems = [];

    // 2. Validate Items and Check Stock
    for (const item of items) {
      const itemDoc = await Item.findById(item.itemId).session(session);
      if (!itemDoc) {
        throw new Error(`Item ${item.itemId} not found`);
      }

      // Optional: Check if enough stock exists before selling
      if (itemDoc.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${itemDoc.name}. Available: ${itemDoc.stock}`);
      }

      processedItems.push({
        itemId: item.itemId,
        name: item.name || itemDoc.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        gstPercentage: item.gstPercentage,
        total: item.total,
      });
    }

    // 3. Save Sale document
    const newSale = new Sale({
      ...saleData,
      items: processedItems,
    });
    const savedSale = await newSale.save({ session });

    // 4. Create Payment Tracking Record
    const initialPayment = new SalesPayment({
      saleId: savedSale._id,
      invoiceNo: savedSale.invoiceNo,
      customerId: savedSale.customerId,
      customerName: savedSale.customerName,
      totalAmount: savedSale.totalAmount,
      payments: [{
        amount_paid: saleData.amountPaid || 0,
        pay_type: saleData.paymentMethod || "Cash",
        payment_date: new Date(),
        note: "Initial payment at time of sale"
      }]
    });
    await initialPayment.save({ session });

    // 5. Update Stock AND Create Stock History (OUT)
    const salesStockUpdates = processedItems.map(async (item) => {
      // Get the current stock before modification
      const currentItem = await Item.findById(item.itemId).session(session);
      const openingStock = currentItem.stock || 0;
      const closingStock = openingStock - item.quantity;

      // Update Item Stock (Atomic Decrease)
      await Item.findByIdAndUpdate(
        item.itemId,
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      // Create Stock History Record
      const history = new StockHistory({
        itemId: item.itemId,
        itemName: item.name,
        type: "OUT",
        transactionType: "SALE",
        referenceId: savedSale._id,
        referenceNo: savedSale.invoiceNo,
        quantity: item.quantity,
        openingStock: openingStock,
        closingStock: closingStock,
        date: new Date()
      });

      return history.save({ session });
    });

    await Promise.all(salesStockUpdates);

    // 6. COMMIT the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedSale);
  } catch (error) {
    // 7. ROLLBACK on any failure
    await session.abortTransaction();
    session.endSession();

    console.error("Sales Transaction Error:", error);
    res.status(400).json({ message: error.message });
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
