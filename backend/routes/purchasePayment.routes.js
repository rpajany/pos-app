import express from "express";
const router = express.Router();
import { 
    getPurchasePaymentReport,
    addPurchasePayment, 
    getPurchasePaymentById, 
    updatePurchasePayment, 
    deletePurchasePayment 
} from "../controllers/purchasePayment.controller.js";

router.get("/outward", getPurchasePaymentReport);
router.get("/:purchaseId", getPurchasePaymentById);
router.put("/add/:purchaseId", addPurchasePayment);
router.put("/update/:purchaseId/:paymentId", updatePurchasePayment);
router.delete("/:purchaseId/:paymentId", deletePurchasePayment);

export default router;