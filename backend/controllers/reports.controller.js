import SalesPayment from "../models/SalesPayment.js";
import PurchasePayment from "../models/PurchasePayment.js";

export const getCashFlowSummary = async (req, res) => {
  try {
    // 1. Match the parameter names from your frontend (startDate/endDate)
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Date range required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 2. CRITICAL: Set the end of the day to 23:59:59
    // Without this, a payment made today at 2 PM won't show up if searching "to today"
    end.setHours(23, 59, 59, 999);

    const [salesData, purchaseData] = await Promise.all([
      SalesPayment.aggregate([
        { $unwind: "$payments" },
        { 
          $match: { 
            "payments.payment_date": { $gte: start, $lte: end } 
          } 
        },
        { $group: { _id: null, total: { $sum: "$payments.amount_paid" } } }
      ]),
      PurchasePayment.aggregate([
        { $unwind: "$payments" },
        { 
          $match: { 
            "payments.payment_date": { $gte: start, $lte: end } 
          } 
        },
        { $group: { _id: null, total: { $sum: "$payments.amount_paid" } } }
      ])
    ]);

    const totalIn = salesData[0]?.total || 0;
    const totalOut = purchaseData[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalInflow: totalIn,
        totalOutflow: totalOut,
        netCashFlow: totalIn - totalOut
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};