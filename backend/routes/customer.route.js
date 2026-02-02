import express from "express"
import Customer from "../models/Customer.js"
import  {verifyToken} from '../middleware/auth.middleware.js';
import { addToSyncQueue } from "../services/syncService.js"

const router = express.Router()

router.get("/load", verifyToken, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/", verifyToken, async (req, res) => {
  try {
    // Create customer object from body
    const customerData = { ...req.body };
    // Explicitly remove customerCode if it exists in request body
    // so the middleware can generate the correct sequential one
    delete customerData.customerCode;

   const newCustomer = new Customer(customerData);
    await newCustomer.save(); // The pre-save logic runs here

    // Sync queue logic  
    await addToSyncQueue("customers", "create", newCustomer._id.toString(), req.body)

    res.status(201).json(newCustomer)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) return res.status(404).json({ message: "Customer not found" })
    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!customer) return res.status(404).json({ message: "Customer not found" })

    await addToSyncQueue("customers", "update", req.params.id, req.body)

    res.json(customer)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!customer) return res.status(404).json({ message: "Customer not found" })

    await addToSyncQueue("customers", "delete", req.params.id, {})

    res.json({ message: "Customer deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
