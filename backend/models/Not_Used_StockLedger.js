import mongoose from "mongoose";

const stockLedgerSchema = new mongoose.Schema({
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', // Make sure this matches your Item model name
    required: true 
  },
  changeQuantity: { 
    type: Number, 
    required: true 
  },
  finalStock: { 
    type: Number, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    enum: ["Initial Entry", "Manual Update", "Sale", "Bulk Import", "Return", "Adjustment"]
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const StockLedger = mongoose.model("StockLedger", stockLedgerSchema);
export default StockLedger;