import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  itemName: { type: String, required: true },
  type: { type: String, enum: ["IN", "OUT"], required: true }, // IN for Purchase, OUT for Sales
  transactionType: { type: String, enum: ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN"], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the Sale or Purchase
  referenceNo: { type: String, required: true }, // Invoice No or Purchase No
  quantity: { type: Number, required: true },
  openingStock: { type: Number, required: true },
  closingStock: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("StockHistory", stockHistorySchema);