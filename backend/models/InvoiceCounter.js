import mongoose from "mongoose"

const invoiceCounterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD format
  counter: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.model("InvoiceCounter", invoiceCounterSchema)
