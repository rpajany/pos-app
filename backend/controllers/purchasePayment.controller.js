import mongoose from "mongoose";
import PurchasePayment from "../models/PurchasePayment.js";
import Purchase from "../models/Purchase.js";


export const getPurchasePaymentReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const report = await PurchasePayment.aggregate([
      { $unwind: "$payments" },
      {
        $match: {
          "payments.payment_date": { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalCash: {
            $sum: { $cond: [{ $eq: ["$payments.pay_type", "Cash"] }, "$payments.amount_paid", 0] },
          },
          totalUPI: {
            $sum: { $cond: [{ $eq: ["$payments.pay_type", "UPI"] }, "$payments.amount_paid", 0] },
          },
          totalBank: {
            $sum: { $cond: [{ $eq: ["$payments.pay_type", "Bank Transfer"] }, "$payments.amount_paid", 0] },
          },
          allTransactions: {
            $push: {
              purchaseNo: "$purchaseNo",
              supplierName: "$supplierName",
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
      data: report[0] || { totalCash: 0, totalUPI: 0, totalBank: 0, allTransactions: [] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const addPurchasePayment = async (req, res) => {
  const { purchaseId } = req.params;
  const { amount_paid, pay_type, note } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const record = await PurchasePayment.findOne({ purchaseId }).session(
      session
    );
    if (!record) throw new Error("Purchase payment record not found");

    record.payments.push({
      amount_paid: Number(amount_paid),
      pay_type,
      note,
      payment_date: new Date(),
    });

    await record.save({ session });

    const totals = record.payments.reduce(
      (acc, curr) => {
        acc.total += Number(curr.amount_paid);
        return acc;
      },
      { total: 0 }
    );

    const isFullyPaid = record.totalPurchaseAmount - totals.total <= 0;

    // Update Purchase summary
    await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        paidAmount: totals.total,
        status: isFullyPaid ? "completed" : "pending",
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchasePaymentById = async (req, res) => {
  console.log("called");
  const { purchaseId } = req.params;
  try {
    const paymentRecord = await PurchasePayment.findOne({ purchaseId });
    if (!paymentRecord)
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: paymentRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... Similar logic for updatePurchasePayment and deletePurchasePayment ...

// export const updatePurchasePayment = async (req, res) => {
//   const { invoiceId, paymentId } = req.params;
//   const { amount_paid, pay_type, note } = req.body;
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     // 1. Find the Ledger
//     const record = await purchasePayment
//       .findOne({ invoiceId })
//       .session(session);
//     if (!record) throw new Error("Payment record not found");

//     // 2. Find specific sub-document in the payments array
//     const paymentEntry = record.payments.id(paymentId);
//     if (!paymentEntry) throw new Error("Specific payment entry not found");

//     // 3. Update the entry fields
//     paymentEntry.amount_paid = Number(amount_paid);
//     paymentEntry.pay_type = pay_type;
//     paymentEntry.note = note;
//     paymentEntry.payment_date = new Date(); // Optional: update date to 'now' or keep original

//     // 4. Save SalesPayment (Triggers pre-save balance math)
//     await record.save({ session });

//     // 5. Recalculate totals for the Main Sales Document
//     const totals = record.payments.reduce(
//       (acc, curr) => {
//         const amt = Number(curr.amount_paid);
//         if (curr.pay_type === "Cash") acc.cash += amt;
//         if (curr.pay_type === "UPI") acc.upi += amt;
//         acc.total += amt;
//         return acc;
//       },
//       { cash: 0, upi: 0, total: 0 }
//     );

//     const isFullyPaid = record.totalInvoiceAmount - totals.total <= 0;

//     // 6. Sync to Purchase Bill
//     await Purchase.findByIdAndUpdate(
//       invoiceId,
//       {
         
//         amountPaid: totals.total,
//         status: isFullyPaid ? "complete" : "pending",
//         // paymentStatus: isFullyPaid ? "Fully Paid" : "Partially Paid",
//       },
//       { session }
//     );

//     // 7. Commit Transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({ success: true, data: record });
//   } catch (error) {
//     // Rollback changes if anything failed
//     await session.abortTransaction();
//     session.endSession();

//     console.error("Update Transaction Failed:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const updatePurchasePayment = async (req, res) => {
  const { purchaseId, paymentId } = req.params; // Changed from invoiceId
  const { amount_paid, pay_type, note } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const record = await PurchasePayment.findOne({ purchaseId }).session(session);
    if (!record) throw new Error("Payment record not found");

    const paymentEntry = record.payments.id(paymentId);
    if (!paymentEntry) throw new Error("Specific payment entry not found");

    paymentEntry.amount_paid = Number(amount_paid);
    paymentEntry.pay_type = pay_type;
    paymentEntry.note = note;

    await record.save({ session });

    const totalPaid = record.payments.reduce((sum, curr) => sum + Number(curr.amount_paid), 0);
    const isFullyPaid = record.totalPurchaseAmount - totalPaid <= 0;

    await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        paidAmount: totalPaid, // Ensure field name matches Purchase Schema
        status: isFullyPaid ? "completed" : "pending",
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePurchasePayment = async (req, res) => {
  const { purchaseId, paymentId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the record
    const record = await PurchasePayment.findOne({ purchaseId }).session(session);
    if (!record) throw new Error("Purchase payment record not found");

    // 2. Remove the specific payment from the array
    record.payments = record.payments.filter(
      (p) => p._id.toString() !== paymentId
    );

    // 3. Save (this triggers the pre-save hook to recalculate balanceAmount and totalPaidAmount)
    await record.save({ session });

    // 4. Update the main Purchase document
    const isStillPaid = record.balanceAmount <= 0;
    
    await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        paidAmount: record.totalPaidAmount,
        status: isStillPaid ? "completed" : "pending",
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};
