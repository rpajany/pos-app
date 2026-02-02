import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  tagline: { type: String },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  gstNumber: { type: String },
  currencySymbol: { type: String, default: "₹" },
  logo: { type: String }, // Base64 string
  bank_name:{type: String},
  branch:{type: String},
  acNumber:{type: String},
  ifsc:{type: String},
  micr:{type: String},
  footerNote: { type: String, default: "Thank you for shopping with us!" }
}, { timestamps: true });

export default mongoose.model("Company", companySchema);