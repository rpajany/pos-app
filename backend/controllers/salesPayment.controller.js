import mongoose from "mongoose";
import SalesPayment from "../models/SalesPayment.js";
import Sales from "../models/Sale.js";

export const getCollectionReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Convert strings to Date objects
    const start = new Date(fromDate);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999); // Include the full end day

    const report = await SalesPayment.aggregate([
      { $unwind: "$payments" }, // Flatten the payments array
      {
        $match: {
          "payments.payment_date": { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalCash: {
            $sum: {
              $cond: [
                { $eq: ["$payments.pay_type", "Cash"] },
                "$payments.amount_paid",
                0,
              ],
            },
          },
          totalUPI: {
            $sum: {
              $cond: [
                { $eq: ["$payments.pay_type", "UPI"] },
                "$payments.amount_paid",
                0,
              ],
            },
          },
          totalBank: {
            $sum: {
              $cond: [
                { $eq: ["$payments.pay_type", "Bank"] },
                "$payments.amount_paid",
                0,
              ],
            },
          },
          allTransactions: {
            $push: {
              invoiceNo: "$invoiceNo",
              amount: "$payments.amount_paid",
              type: "$payments.pay_type",
              date: "$payments.payment_date",
              note: "$payments.note",
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: report[0] || {
        totalCash: 0,
        totalUPI: 0,
        totalBank: 0,
        allTransactions: [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// export const addPaymentInstallment = async (req, res) => {
//   const { invoiceId } = req.params; // This is the Sales ObjectId
//   const { amount_paid, pay_type, note } = req.body;

//   try {
//     // 1. Find the Payment Ledger
//     const record = await SalesPayment.findOne({ invoiceId });

//     if (!record) return res.status(404).json({ message: "Payment record not found" });

//     // 2. Add the new installment
//     record.payments.push({
//       amount_paid: Number(amount_paid),
//       pay_type,
//       note,
//       payment_date: new Date()
//     });

//     // Save the payment record
//     await record.save();

//     // 3. AGGREGATE TOTALS: Calculate specific type totals from the array
//     const totals = record.payments.reduce((acc, curr) => {
//       const amt = Number(curr.amount_paid);
//       if (curr.pay_type === "Cash") acc.cash += amt;
//       if (curr.pay_type === "UPI") acc.upi += amt;
//       acc.total += amt;
//       return acc;
//     }, { cash: 0, upi: 0, total: 0 });

//     // 4. UPDATE SALES BILL: Sync these totals to the main Sales document
//     const updatedStatus = record.balanceAmount <= 0 ? "complete" : "pending";
//     const paymentStatus = record.balanceAmount <= 0 ? "Fully Paid" : "Partially Paid";

//     await Sales.findByIdAndUpdate(invoiceId, {
//       // cashReceived: totals.cash,
//       // upiReceived: totals.upi,
//       // totalReceived: totals.total, // Total received
//       // paidAmount: totals.total, // Total received
//       status: updatedStatus,
//       // paymentStatus: paymentStatus
//     });

//    res.status(200).json({ success: true, data: record });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const addPaymentInstallment = async (req, res) => {
  const { invoiceId } = req.params;
  const { amount_paid, pay_type, note } = req.body;

  // 1. Start the Session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Find and Update the Payment Ledger within the session
    const record = await SalesPayment.findOne({ invoiceId }).session(session);
    if (!record) throw new Error("Payment record not found");

    // Add new payment to history array
    record.payments.push({
      amount_paid: Number(amount_paid),
      pay_type,
      note,
      payment_date: new Date(),
    });

    // Save the record (Triggers balance calculation in pre-save middleware)
    await record.save({ session });

    // 3. Aggregate totals for the main Sales model
    const totals = record.payments.reduce(
      (acc, curr) => {
        const amt = Number(curr.amount_paid);
        if (curr.pay_type === "Cash") acc.cash += amt;
        if (curr.pay_type === "UPI") acc.upi += amt;
        acc.total += amt;
        return acc;
      },
      { cash: 0, upi: 0, total: 0 }
    );

    const isFullyPaid = record.totalInvoiceAmount - totals.total <= 0;

    // 4. Update the Main Sales Document within the session
    await Sales.findByIdAndUpdate(
      invoiceId,
      {
        // cashReceived: totals.cash,
        // upiReceived: totals.upi,
        // paidAmount: totals.total,
        status: isFullyPaid ? "completed" : "pending",
        // paymentStatus: isFullyPaid ? "Fully Paid" : "Partially Paid"
      },
      { session, new: true }
    );

    // 5. If both operations succeed, commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    // 6. If anything fails, abort and undo everything
    await session.abortTransaction();
    session.endSession();

    console.error("Transaction Aborted:", error.message);
    res.status(500).json({
      success: false,
      message: "Database Sync Error: Payment not recorded.",
    });
  }
};

/**
 * Fetch SalesPayment record by the Sale's ObjectId
 */
export const getPaymentByInvoiceId = async (req, res) => {
  const { invoiceId } = req.params;

  try {
    // Find the payment record linked to this specific sale
    const paymentRecord = await SalesPayment.findOne({ invoiceId: invoiceId });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "No payment record found for this invoice.",
      });
    }

    res.status(200).json({
      success: true,
      data: paymentRecord,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching payment details.",
    });
  }
};

// HELPER: Syncs SalesPayment totals back to the Sales model
const syncToSalesBill = async (invoiceId) => {
  const paymentRecord = await SalesPayment.findOne({ invoiceId });

  // Calculate specific totals
  const cash = paymentRecord.payments
    .filter((p) => p.pay_type === "Cash")
    .reduce((sum, p) => sum + p.amount_paid, 0);

  const upi = paymentRecord.payments
    .filter((p) => p.pay_type === "UPI")
    .reduce((sum, p) => sum + p.amount_paid, 0);

  const totalPaid = cash + upi;
  const isComplete = paymentRecord.totalInvoiceAmount - totalPaid <= 0;

  await Sales.findByIdAndUpdate(invoiceId, {
    cashReceived: cash,
    upiReceived: upi,
    paidAmount: totalPaid,
    status: isComplete ? "completed" : "pending",
    paymentStatus: isComplete ? "Fully Paid" : "Partially Paid",
  });
};

// DELETE PAYMENT
// export const deletePayment = async (req, res) => {
//   const { invoiceId, paymentId } = req.params;
//   try {
//     const record = await SalesPayment.findOne({ invoiceId });
//     // Remove the specific payment from array
//     record.payments = record.payments.filter(p => p._id.toString() !== paymentId);

//     await record.save(); // Pre-save hook updates internal balance/totals
//     await syncToSalesBill(invoiceId); // Sync main Sales document

//     res.json({ success: true, data: record });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

export const deletePayment = async (req, res) => {
  const { invoiceId, paymentId } = req.params;

  // 1. Start the Session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Perform operations within the session
    const record = await SalesPayment.findOne({ invoiceId }).session(session);
    if (!record) throw new Error("Payment record not found");

    // Remove the payment
    record.payments = record.payments.filter(
      (p) => p._id.toString() !== paymentId
    );
    await record.save({ session });

    // 3. Recalculate totals for Sales Bill
    const cash = record.payments
      .filter((p) => p.pay_type === "Cash")
      .reduce((s, p) => s + p.amount_paid, 0);
    const upi = record.payments
      .filter((p) => p.pay_type === "UPI")
      .reduce((s, p) => s + p.amount_paid, 0);
    const totalPaid = cash + upi;
    const isComplete = record.totalInvoiceAmount - totalPaid <= 0;

    await Sales.findByIdAndUpdate(
      invoiceId,
      {
        cashReceived: cash,
        upiReceived: upi,
        paidAmount: totalPaid,
        status: isComplete ? "completed" : "pending",
        paymentStatus: isComplete ? "Fully Paid" : "Partially Paid",
      },
      { session }
    );

    // 4. Commit everything to the database
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, data: record });
  } catch (err) {
    // 5. If ANYTHING fails, undo everything (Rollback)
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Transaction Failed: " + err.message });
  }
};

// EDIT PAYMENT (Update amount or type)
// export const updatePayment = async (req, res) => {
//   const { invoiceId, paymentId } = req.params;
//   const { amount_paid, pay_type, note } = req.body;
//   try {
//     const record = await SalesPayment.findOne({ invoiceId });
//     const payment = record.payments.id(paymentId);

//     payment.amount_paid = Number(amount_paid);
//     payment.pay_type = pay_type;
//     payment.note = note;

//     await record.save();
//     await syncToSalesBill(invoiceId);

//     res.json({ success: true, data: record });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

export const updatePayment = async (req, res) => {
  const { invoiceId, paymentId } = req.params;
  const { amount_paid, pay_type, note } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the Ledger
    const record = await SalesPayment.findOne({ invoiceId }).session(session);
    if (!record) throw new Error("Payment record not found");

    // 2. Find specific sub-document in the payments array
    const paymentEntry = record.payments.id(paymentId);
    if (!paymentEntry) throw new Error("Specific payment entry not found");

    // 3. Update the entry fields
    paymentEntry.amount_paid = Number(amount_paid);
    paymentEntry.pay_type = pay_type;
    paymentEntry.note = note;
    paymentEntry.payment_date = new Date(); // Optional: update date to 'now' or keep original

    // 4. Save SalesPayment (Triggers pre-save balance math)
    await record.save({ session });

    // 5. Recalculate totals for the Main Sales Document
    const totals = record.payments.reduce(
      (acc, curr) => {
        const amt = Number(curr.amount_paid);
        if (curr.pay_type === "Cash") acc.cash += amt;
        if (curr.pay_type === "UPI") acc.upi += amt;
  
        acc.total += amt;
        return acc;
      },
      { cash: 0, upi: 0,   total: 0 }
    );

    const isFullyPaid = record.totalInvoiceAmount - totals.total <= 0;

    // 6. Sync to Sales Bill
    await Sales.findByIdAndUpdate(
      invoiceId,
      {
        cashReceived: totals.cash,
        upiReceived: totals.upi,
        paidAmount: totals.total,
        status: isFullyPaid ? "completed" : "pending",
        paymentStatus: isFullyPaid ? "Fully Paid" : "Partially Paid",
      },
      { session }
    );

    // 7. Commit Transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    // Rollback changes if anything failed
    await session.abortTransaction();
    session.endSession();

    console.error("Update Transaction Failed:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
