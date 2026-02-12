
// model/item.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  nameTamil: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  barcode: { type: String, unique: true, sparse: true },
  location: { type: String },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  unit: { type: String, default: "UNT" }, // Unit Quantity Code (UQC) like PCS, KGS, UNT
  supplier: { type: String },
  hsnCode: { type: String,required: true, minlength: 4, maxlength: 8 },
  tax_category:{type: Number, enum: [0, 5, 18, 40], default: 18}, // GST 2.0 Slabs
  gstPercentage: { type: Number, default: 18, min: 0, max: 100 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  // Storing photo as a Base64 string
  photo: {
    type: String,
    description: "Base64 encoded image string",
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Item", itemSchema);
