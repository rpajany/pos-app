import express from "express";
import  {verifyToken} from '../middleware/auth.middleware.js';
import { addToSyncQueue } from "../services/syncService.js"
import {downloadGSTReport} from "../controllers/gstReport.controller.js";


const router = express.Router();

router.get("/download",  downloadGSTReport); //verifyToken,

export default router;