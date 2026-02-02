import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  // customerCode: { type: String, required: true, unique: true },
  customerCode: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pinCode: { type: String },
  customerType: { type: String, enum: ["B2B", "B2C"], default: "B2C" },
  gstNumber: { type: String, uppercase: true, trim: true },
  state_code: { type: Number }, // e.g., "27" for Maharashtra. Determines IGST vs CGST+SGST
  is_sez: { type: Boolean, default: false }, // If TRUE, transaction is treated as Inter-state IGST vs CGST/SGST logic
  creditLimit: { type: Number, default: 0 },
  currentCredit: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to generate Customer Code
// Use Async function without 'next' - Mongoose supports this!
customerSchema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    // 'this.constructor' refers to the Customer model itself
    const lastCustomer = await this.constructor
      .findOne({}, { customerCode: 1 })
      .sort({ createdAt: -1 });

    let newSerialNumber = 1;

    if (lastCustomer && lastCustomer.customerCode) {
      // Use regex to find only the digits in the string
      const match = lastCustomer.customerCode.match(/\d+/);
      if (match) {
        newSerialNumber = parseInt(match[0]) + 1;
      }
    }

    // Assign directly to this.customerCode
    this.customerCode = `CUST${newSerialNumber.toString().padStart(5, "0")}`;
  } catch (error) {
    // If using async without next, you throw the error to catch it in the route
    throw error;
  }
});

// Handle potential "OverwriteModelError" in development
const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
