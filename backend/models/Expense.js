import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  category: { 
    type: String, 
    required: true, 
    enum: ["Electricity", "Rent", "Staff Tea/Food", "Stationery", "Cleaning", "Repair", "Other"] 
  },
  amount: { type: Number, required: true },
  description: { type: String },
  paymentMethod: { type: String, enum: ["Cash", "Bank Transfer", "UPI"], default: "Cash" },
  recordedBy: { type: String }, // User name or ID
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;