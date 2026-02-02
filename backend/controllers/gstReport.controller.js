// controllers/gstReport.controller.js
import { Parser } from "json2csv";
import Sale from "../models/Sale.js";

export const downloadGSTReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query; // type: 'b2b', 'b2cs', or 'hsn'
    const start = new Date(startDate);
    const end = new Date(endDate);

    let data = [];
    let fields = [];
    let filename = "";

    if (type === "b2b") {
      // TABLE 4A, 4B: B2B Invoices
      data = await Sale.find({
        saleDate: { $gte: start, $lte: end },
        customerType: "B2B",
        status: "completed",
      }).populate("customerId");

      // console.log("data :", data);

      fields = [
        { label: "GSTIN/UIN of Recipient", value: "customerId.gstNumber" },
        { label: "Receiver Name", value: "customerId.name" },
        { label: "Invoice Number", value: "invoiceNo" },
        {
          label: "Invoice date",
          value: (row) => row.saleDate.toISOString().split("T")[0],
        },
        { label: "Invoice Value", value: "totalAmount" },
        { label: "Place Of Supply", value: "placeOfSupply" },
        { label: "Reverse Charge", value: () => "N" },
        { label: "Applicable % of Tax Rate", value: () => "" },
        { label: "Invoice Type", value: () => "Regular" },
        { label: "Taxable Value", value: "totalTaxableValue" },
        { label: "Central Tax", value: "totalCGST" },
        { label: "State/UT Tax", value: "totalSGST" },
        { label: "Integrated Tax", value: "totalIGST" },
      ];
      filename = `GSTR1_B2B_${startDate}.csv`;
    } 
    else if (type === "b2cs") {
  // Aggregate B2C sales by Place of Supply and GST Rate
  data = await Sale.aggregate([
    { $match: { saleDate: { $gte: start, $lte: end }, customerType: "B2C", status: "completed" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: { pos: "$placeOfSupply", rate: "$items.gstPercentage" },
        taxableValue: { $sum: "$items.taxableValue" },
        cgst: { $sum: "$items.cgst" },
        sgst: { $sum: "$items.sgst" },
        igst: { $sum: "$items.igst" },
        totalValue: { $sum: "$items.total" }
      }
    }
  ]);

  // Transform for CSV/Table
  data = data.map(item => ({
    gstPercentage: item._id.rate,
    description: `POS: ${item._id.pos} | Rate: ${item._id.rate}%`,
    taxableValue: item.taxableValue,
    cgst: item.cgst,
    sgst: item.sgst,
    igst: item.igst,
    totalValue: item.totalValue
  }));

  fields = ["description", "taxableValue", "cgst", "sgst", "igst", "totalValue"];
  filename = `GSTR1_B2CS_${startDate}.csv`;
}
    
    
    else if (type === "hsn") {
      // TABLE 12: HSN Summary (B2B & B2C Separated)
      const hsnData = await Sale.aggregate([
        {
          $match: { saleDate: { $gte: start, $lte: end }, status: "completed" },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              hsn: "$items.hsnCode",
              type: "$customerType",
              gstPercentage: "$items.gstPercentage",
            },
            uqc: { $first: "$items.unit" }, // Ensure you store UQC like 'PCS', 'NOS'
            totalQty: { $sum: "$items.quantity" },
            totalValue: { $sum: "$items.total" },
            taxableValue: { $sum: "$items.taxableValue" },
            
            integratedTax: { $sum: "$items.igst" },
            centralTax: { $sum: "$items.cgst" },
            stateTax: { $sum: "$items.sgst" },
          },
        },
      ]);

      data = hsnData.map((item) => ({
        hsn: item._id.hsn,
        gstPercentage: item._id.gstPercentage,
        description: "Goods", // Auto-populated in portal but good to have
        uqc: item.uqc || "UNT",
        totalQty: item.totalQty,
        totalValue: item.totalValue,
        taxableValue: item.taxableValue,
    
        igst: item.integratedTax,
        cgst: item.centralTax,
        sgst: item.stateTax,
        type: item._id.type, // Used to filter into 12A (B2B) or 12B (B2C)
      }));

      fields = [
        "hsn",
        "unit",
        "totalQty",
        "totalValue",
        "taxableValue",
        "gstPercentage",
        "igst",
        "cgst",
        "sgst",
      ];
      filename = `GSTR1_HSN_Summary_${startDate}.csv`;
    }

    // Check if user just wants to view JSON in the DataTable
    if (req.query.format === "json") {
      return res.json(data);
    }

    // Otherwise, send CSV as before
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(filename);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* GSTR-1 Sales Report Logic
The government requires separate tabs for B2B (GST registered) and B2C (unregistered) sales. */

const generateGSTR1Reports = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const results = await Sale.aggregate([
    { $match: { saleDate: { $gte: start, $lte: end }, status: "completed" } },
    {
      $facet: {
        // TABLE 4: B2B Invoices (Business to Business)
        b2b: [
          { $match: { customerType: "B2B" } },
          {
            $lookup: {
              from: "customers",
              localField: "customerId",
              foreignField: "_id",
              as: "cust",
            },
          },
          { $unwind: "$cust" },
          {
            $project: {
              gstin: "$cust.gstNumber",
              invoiceNo: 1,
              date: "$saleDate",
              value: "$totalAmount",
              pos: "$placeOfSupply",
              taxable: "$totalTaxableValue",
              igst: "$totalIGST",
              cgst: "$totalCGST",
              sgst: "$totalSGST",
            },
          },
        ],
        // TABLE 7: B2CS (Business to Consumer Small - Intra-state or Inter-state < 1L)
        b2cs: [
          { $match: { customerType: "B2C", isLargeB2C: false } },
          { $unwind: "$items" },
          {
            $group: {
              _id: { pos: "$placeOfSupply", rate: "$items.gstPercentage" },
              totalTaxable: { $sum: "$items.taxableValue" },
              totalCgst: { $sum: "$items.cgst" },
              totalSgst: { $sum: "$items.sgst" },
              totalIgst: { $sum: "$items.igst" },
            },
          },
        ],
      },
    },
  ]);

  return results[0];
};

/* Table 12: HSN-wise Summary (Mandatory)
In 2026, you must bifurcate HSN summaries into B2B and B2C tabs. */
const getHsnSummaryReport = async (startDate, endDate) => {
  return await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          hsn: "$items.hsnCode",
          gstPercentage: "$items.gstPercentage",
          type: "$customerType", // B2B vs B2C bifurcation
        },
        totalQty: { $sum: "$items.quantity" },
        totalTaxable: { $sum: "$items.taxableValue" },
        totalCgst: { $sum: "$items.cgst" },
        totalSgst: { $sum: "$items.sgst" },
        totalIgst: { $sum: "$items.igst" },
        totalValue: { $sum: "$items.total" },
      },
    },
    { $sort: { "_id.hsn": 1 } },
  ]);
};

/* GSTR-3B: Monthly Tax Liability
This is the "Payment" report. It consolidates all sales into 5-6 lines for quick filing. */
const getGSTR3B_Summary = async (startDate, endDate) => {
  return await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: null,
        totalTaxable: { $sum: "$totalTaxableValue" },
        integratedTax: { $sum: "$totalIGST" },
        centralTax: { $sum: "$totalCGST" },
        stateTax: { $sum: "$totalSGST" },
      },
    },
  ]);
};
