import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNo: { type: String, required: true, unique: true },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: { type: String, required: true },
    supplierStateCode: { type: Number },

    purchaseDate: { type: Date, default: Date.now },
    dueDate: { type: Date },

    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        itemName: String,
        hsnCode: String,
        quantity: { type: Number, required: true },
        purchasePrice: { type: Number, required: true },

        // Discount Fields
        discountPercentage: { type: Number, default: 0 }, // Added: For rate-based discounts
        discountAmount: { type: Number, default: 0 }, // Calculated: (Qty * Price) * (Disc% / 100)

        // GST Breakdown
        taxableValue: { type: Number, required: true },
        gstPercentage: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 }, // Added: Total tax for this specific item
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },

        total: { type: Number, required: true },
      },
    ],

    // Summary Totals
    totalTaxableValue: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 }, // Sum of all item gstAmounts
    totalDiscount: { type: Number, default: 0 },

    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "received", "completed", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
    type: String,
    enum: ["cash", "UPI", "card", "check", "credit"],
    default: "cash",
  },
    amountPaid: { type: Number, default: 0 },
    amountBalance: { type: Number, default: 0 },

    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
