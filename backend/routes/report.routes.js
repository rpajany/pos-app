import express from "express";
import {getCashFlowSummary} from "../controllers/reports.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

 
router.get("/cashFlow", verifyToken, getCashFlowSummary )
 



export default router;