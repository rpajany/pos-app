import express from "express";
import Item from "../models/Item.js";
import Sale from "../models/Sale.js"; // Assuming your models
import salesPayment from "../models/SalesPayment.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/stats", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const monthNames = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // ALL 9 QUERIES MUST BE INSIDE THIS ARRAY
    const [
      salesTotal,
      purchaseTotal,
      expenseTotal,
      salesMonthly,
      purchaseMonthly,
      expenseMonthly,
      topItemsRaw,
      lowStockRaw,
      stockValueRaw, // Now correctly receiving the 9th result
      paymentMethodsRaw, // 10th result
      recentSalesRaw, // <--- Add this 11th variable here
    ] = await Promise.all([
      // 1-3: Summaries
      Sale.aggregate([
        {
          $match: { saleDate: { $gte: start, $lte: end }, status: "completed" },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Purchase.aggregate([
        { $match: { purchaseDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end }, isActive: true } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // 4-6: Monthly Data
      Sale.aggregate([
        { $match: { saleDate: { $gte: yearStart }, status: "completed" } },
        {
          $group: {
            _id: { $month: "$saleDate" },
            total: { $sum: "$totalAmount" },
          },
        },
      ]),
      Purchase.aggregate([
        { $match: { purchaseDate: { $gte: yearStart } } },
        {
          $group: {
            _id: { $month: "$purchaseDate" },
            total: { $sum: "$totalAmount" },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: yearStart }, isActive: true } },
        { $group: { _id: { $month: "$date" }, total: { $sum: "$amount" } } },
      ]),

      // 7: Top Items
      Sale.aggregate([
        {
          $match: { saleDate: { $gte: start, $lte: end }, status: "completed" },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.itemId",
            qty: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.total" },
          },
        },
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "_id",
            as: "itemDetails",
          },
        },
        { $unwind: "$itemDetails" },
        {
          $project: {
            _id: 1,
            qty: 1,
            revenue: 1,
            name: "$itemDetails.itemName",
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 10 },
      ]),

      // 8: Low Stock
      Item.find({ $expr: { $lte: ["$stock", "$minStock"] }, isActive: true })
        .select("itemName stock minStock category")
        .limit(5),

      // 9: Stock Value (MUST BE INSIDE PROMISE.ALL)
      Item.aggregate([
        { $match: { isActive: true, stock: { $gt: 0 } } }, // Only count items actually in stock
        {
          $group: {
            _id: null,
            totalCostValue: {
              $sum: { $multiply: ["$stock", "$purchasePrice"] },
            },
            totalRetailValue: {
              $sum: { $multiply: ["$stock", "$sellingPrice"] },
            },
          },
        },
      ]),

      // 10. Payment Method Breakdown (Case-insensitive fix)
      // Sale.aggregate([
      //   {
      //     $match: {
      //       saleDate: { $gte: start, $lte: end },
      //       status: "completed",
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: { $toLower: "$paymentMethod" }, // Forces 'Cash' and 'cash' into the same group
      //       count: { $sum: 1 },
      //       amount: { $sum: "$totalAmount" },
      //     },
      //   },
      // ]),




      // 10. Payment Method Breakdown (Fixed to use SalesPayment with Array Unwinding)
      salesPayment.aggregate([
        {
          // Step 1: Flatten the payments array so each payment record is a separate document
          $unwind: "$payments"
        },
        {
          // Step 2: Filter by date (using the payment_date inside the array) and status
          $match: {
            "payments.payment_date": { $gte: start, $lte: end },
            "payments.status": "Success",
          },
        },
        {
          // Step 3: Group by the payment type (Cash, UPI, etc.)
          $group: {
            _id: { $toLower: "$payments.pay_type" }, 
            count: { $sum: 1 },
            amount: { $sum: "$payments.amount_paid" },
          },
        },
        {
          // Step 4: Optional - Format the ID to look nice (capitalize first letter)
          $project: {
            method: "$_id",
            count: 1,
            amount: 1,
            _id: 0
          }
        }
      ]),


      // 11. Recent Transactions (Query 11)
      Sale.find({ status: "completed" })
        .sort({ saleDate: -1 })
        .limit(5)
        .populate("customerId", "name phone") // If you want to show the customer name
        .select("invoiceNo totalAmount paymentMethod saleDate"),
    ]);

    
    // MERGE LOGIC
    const masterChartData = monthNames.slice(1).map((name, index) => {
      const monthNum = index + 1;
      return {
        name: name,
        sales: salesMonthly.find((s) => s._id === monthNum)?.total || 0,
        purchases: purchaseMonthly.find((p) => p._id === monthNum)?.total || 0,
        expenses: expenseMonthly.find((e) => e._id === monthNum)?.total || 0,
      };
    });

    const s = salesTotal[0]?.total || 0;
    const p = purchaseTotal[0]?.total || 0;
    const e = expenseTotal[0]?.total || 0;

    res.json({
      summary: {
        sales: s,
        purchases: p,
        expenses: e,
        netProfit: Number((s - p - e).toFixed(2)),
        stockValue: stockValueRaw[0]?.totalCostValue || 0,
        potentialRevenue: stockValueRaw[0]?.totalRetailValue || 0,
      },
      chartData: masterChartData,
      topItems: topItemsRaw || [],
      lowStock: lowStockRaw || [],
      paymentStats: paymentMethodsRaw || [], // Add this
      recentSales: recentSalesRaw || [],
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
