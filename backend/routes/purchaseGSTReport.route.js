import express from "express";
import  Purchase from"../models/Purchase.js"; // Your purchase schema
import  {verifyToken} from '../middleware/auth.middleware.js';
import { addToSyncQueue } from "../services/syncService.js"
import { Parser } from "json2csv"; // Install this: npm install json2csv
 


const router = express.Router();

router.get("/download", async (req, res) => {
 try {
    const { startDate, endDate, type, format } = req.query;
    
    // 1. Fetch Purchases (Logic remains same as previous steps)
    const purchases = await Purchase.find({
      purchaseDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('supplierId');

    let dataToExport = [];
    let fields = [];

    // 2. Format data based on Report Type
    if (type === 'hsn') {
      const hsnMap = {};
      purchases.forEach(p => {
        p.items.forEach(item => {
          const code = item.hsnCode || "NA";
          if (!hsnMap[code]) {
            hsnMap[code] = { 
              hsn: code, description: item.itemName, uqc: item.uqc || 'NOS',
              totalQty: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalValue: 0 
            };
          }
          hsnMap[code].totalQty += item.quantity;
          hsnMap[code].taxableValue += item.taxableValue;
          hsnMap[code].cgst += item.cgst;
          hsnMap[code].sgst += item.sgst;
          hsnMap[code].igst += item.igst;
          hsnMap[code].totalValue += item.total;
        });
      });
      dataToExport = Object.values(hsnMap);
      fields = ['hsn', 'description', 'uqc', 'totalQty', 'taxableValue', 'cgst', 'sgst', 'igst', 'totalValue'];
    } else {
      dataToExport = purchases.map(p => ({
        billNo: p.billNo,
        date: p.purchaseDate.toISOString().split('T')[0],
        supplier: p.supplierId?.name || 'N/A',
        taxableValue: p.totalTaxableValue,
        cgst: p.totalCGST,
        sgst: p.totalSGST,
        igst: p.totalIGST,
        total: p.totalAmount
      }));
      fields = ['billNo', 'date', 'supplier', 'taxableValue', 'cgst', 'sgst', 'igst', 'total'];
    }

    // 3. Handle CSV Format
    if (format === 'csv') {
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(dataToExport);
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`Purchase_${type}_Report_${startDate}_to_${endDate}.csv`);
      return res.send(csv);
    }

    // Default to JSON
    res.json(dataToExport);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;