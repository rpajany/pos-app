import mongoose from "mongoose";

const salesPaymentSchema = new mongoose.Schema({
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Sales", 
    required: true 
  },
  invoiceNo: { type: String, required: true },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true 
  },
  customerName: { type: String }, // Useful for quick searching
  
  // Array to store multiple payment installments
  payments: [
    {
      payment_date: { type: Date, default: Date.now },
      pay_type: { 
        type: String, 
         enum: ["Cash", "UPI", "Card", "check", "credit","Bank Transfer"],
   
        required: true 
      },
      amount_paid: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ["Success", "Pending", "Failed"], 
        default: "Success" 
      },
      note: { type: String },
      transactionId: { type: String } // Optional: for UPI/Bank refs
    }
  ],

  totalInvoiceAmount: { type: Number, required: true },
  totalPaidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  
  // Overall status of the Invoice
  paymentStatus: { 
    type: String, 
    enum: ["Unpaid", "Partially Paid", "Fully Paid"], 
    default: "Unpaid" 
  },
  
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate balance and status automatically
salesPaymentSchema.pre("save", async function () {
  const totalPaid = this.payments.reduce((sum, p) => sum + p.amount_paid, 0);
  this.totalPaidAmount = totalPaid;
  this.balanceAmount = this.totalInvoiceAmount - totalPaid;

  if (this.balanceAmount <= 0) {
    this.paymentStatus = "Fully Paid";
  } else if (totalPaid > 0) {
    this.paymentStatus = "Partially Paid";
  } else {
    this.paymentStatus = "Unpaid";
  }

  this.updatedAt = Date.now();
  
});

export default mongoose.model("SalesPayment", salesPaymentSchema);