// controllers/purchaseGstController.js
import  Purchase from"../models/Purchase.js"; // Your purchase schema
import { Parser } from "json2csv";

export const getPurchaseGSTReport = async (req, res) => {
  try {
    const { startDate, endDate, type, format } = req.query;
    
    // 1. Build Query
    const query = {
      purchaseDate: { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      }
    };

    const purchases = await Purchase.find(query).populate("supplierId");

    // 2. Format Data based on Type
    let formattedData = [];

    if (type === "b2b") {
      formattedData = purchases.map(p => ({
        billNo: p.billNo,
        date: p.purchaseDate,
        supplierName: p.supplierId?.name,
        gstin: p.supplierId?.gstin,
        taxableValue: p.totalTaxableValue,
        cgst: p.totalCGST,
        sgst: p.totalSGST,
        igst: p.totalIGST,
        totalValue: p.totalAmount,
        itcEligibility: "Inputs"
      }));
    } else if (type === "hsn") {
      // Logic for HSN summary aggregation
      // ... (Grouping by HSN code)
    }

    // 3. Return Format
    if (format === "json") {
      return res.json(formattedData);
    } else {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(formattedData);
      res.header('Content-Type', 'text/csv');
      res.attachment(`GSTR2_${type}_${startDate}.csv`);
      return res.send(csv);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPurchaseHSNReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const purchases = await Purchase.find({
      purchaseDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    const hsnMap = {};

    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        const hsn = item.hsnCode || "UNCATEGORIZED";
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn: hsn,
            description: item.description || "",
            uqc: item.uqc || "NOS", // Unit Quantity Code
            totalQuantity: 0,
            totalTaxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalValue: 0
          };
        }

        hsnMap[hsn].totalQuantity += item.quantity || 0;
        hsnMap[hsn].totalTaxableValue += item.taxableValue || 0;
        hsnMap[hsn].cgst += item.cgst || 0;
        hsnMap[hsn].sgst += item.sgst || 0;
        hsnMap[hsn].igst += item.igst || 0;
        hsnMap[hsn].totalValue += item.totalAmount || 0;
      });
    });

    const formattedHSNData = Object.values(hsnMap);
    res.json(formattedHSNData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};