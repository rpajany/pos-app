import express from "express";
import {
  createQuotation,
  getAllQuotations,
  updateStatusComments,
  updateQuotation,
  deleteQuotation,
} from "../controllers/quotation.controller.js";

const router = express.Router();

router.post("/insert", createQuotation);
router.get("/load", getAllQuotations);
router.put("/:id", updateQuotation);
router.put("/status/:id", updateStatusComments);
router.delete("/:id", deleteQuotation);

export default router;
