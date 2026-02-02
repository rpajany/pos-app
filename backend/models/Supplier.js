import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  gstNumber: { type: String }, // Important for tax compliance
  address: { type: String },
  pinCode: { type: String },
  state: { type: String },
  state_code: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Supplier", supplierSchema);
