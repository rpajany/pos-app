import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema({
  quoteNo: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },

  // Linked to Customer Collection
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true 
  },

  customerName: { type: String, required: true },
  contact: { type: String }, // Contact Person
  
  items: [{
    description: String,
    qty: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    hsnCode: String,
    total: Number
  }],

  // --- NEW FIELDS FOR TOTALS ---
  subTotal: { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 }, // Grand Total (subTotal + taxAmount)
  // -----------------------------

  notInScope: { type: String, default: "" },
  
  terms: {
    taxes: { type: String, default: "The Above Price Is Without GST (Exclusive GST)." },
    payment: { type: String, default: "100% Advance Along With The Order." },
    validity: { type: String, default: "Quote Valid For 30 Days..." },
    delivery: { type: String, default: "Estimate Delivery One Week." }
  },
 
  status: { 
    type: String, 
    enum: ["pending", "inprogress", "completed", "cancel", "Draft", "Sent", "Accepted", "Converted"], 
    default: "pending" 
  },
  statusComment: { type: String, default: "" }

}, { timestamps: true });

export default mongoose.model("Quotation", quotationSchema);