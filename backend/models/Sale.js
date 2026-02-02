//model.sale.js
import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  saleDate: { type: Date, default: Date.now },
  customerType: { type: String, enum: ["B2B", "B2C"] }, // Snapshot for reports
  placeOfSupply: { type: Number }, // State code from customer

  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      quantity: Number,
      sellingPrice: Number,
      taxableValue: Number,
      hsnCode: String, // Snapshot at time of sale
      gstPercentage: { type: Number, default: 18 },
      cgst: Number,
      sgst: Number,
      igst: Number,
      gstAmount: { type: Number, default: 0 },
      discountPercentage: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },

      total: Number,
    },
  ],
  totalTaxableValue: Number,
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
  totalIGST: { type: Number, default: 0 },

  // Compliance
  irn: { type: String }, // For businesses > ₹5cr turnover
  isLargeB2C: { type: Boolean, default: false }, // If inter-state AND > ₹1,00,000

  totalTaxableValue: { type: Number, required: true },
  totalTax: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["cash", "UPI", "card", "check", "credit"],
    default: "cash",
  },
  status: {
    type: String,
    enum: ["draft", "completed", "cancelled","pending"],
    default: "completed",
  },
  notes: String,
  cashReceived: { type: Number, default: 0 },
  upiReceived: { type: Number, default: 0 },
  totalReceived: { type: Number, default: 0 },
  balanceChange: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  totalQty: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Sale", saleSchema);
