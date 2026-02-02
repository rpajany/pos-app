import mongoose from "mongoose";

const purchasePaymentSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      unique: true,
    },
    purchaseNo: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },

    totalPurchaseAmount: { type: Number, required: true },
    totalPaidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },

    payments: [
      {
        amount_paid: { type: Number, required: true },
        pay_type: {
          type: String,

          enum: ["Cash", "UPI", "Card", "Bank Transfer"],
          default: "Cash",
          //   set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() // Auto-fix "cash" to "Cash"
          set: (v) => (v ? v.trim() : v),
        },
        payment_date: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Auto-calculate totals before saving
purchasePaymentSchema.pre("save", async function () {
  const totalPaid = this.payments.reduce((sum, p) => sum + p.amount_paid, 0);
  this.totalPaidAmount = totalPaid;
  this.balanceAmount = this.totalPurchaseAmount - totalPaid;
});

export default mongoose.model("PurchasePayment", purchasePaymentSchema);
