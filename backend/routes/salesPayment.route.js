import express from "express";
import  {verifyToken} from '../middleware/auth.middleware.js';
import { addToSyncQueue } from "../services/syncService.js"
import {getCollectionReport, addPaymentInstallment,getPaymentByInvoiceId,updatePayment,deletePayment} from "../controllers/salesPayment.controller.js";


const router = express.Router();

router.get("/report/collection", getCollectionReport);
router.get("/:invoiceId",  verifyToken, getPaymentByInvoiceId); //verifyToken,
router.put("/add/:invoiceId",  verifyToken, addPaymentInstallment); //verifyToken,

// NEW: Update a specific payment entry
// Path: /api/salesPayment/update/:invoiceId/:paymentId
router.put("/update/:invoiceId/:paymentId", updatePayment);

// NEW: Delete a specific payment entry
// Path: /api/salesPayment/:invoiceId/:paymentId
router.delete("/:invoiceId/:paymentId", deletePayment);

export default router;