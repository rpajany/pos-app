import express from "express";
import dotenv from "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { initializeSyncService } from "./services/syncService.js";
import { getSyncStatus, startCloudSync } from "./services/syncService.js";
import logger from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// FIX 1: Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ORIGINS = [
  // "http://localhost:4000", // For local development testing
  "http://localhost:5000", // For local development testing
  // "https://pos-app-qdvc.onrender.com", // For local development testing
  process.env.FRONTEND_URL, // Your deployed client app
].filter(Boolean); // If process.env.FRONTEND_URL is undefined, it will still be in the array.

// Middleware
// --- CORS Configuration ---
const corsOptions = {
  // The 'origin' function checks the incoming request origin against the allowed list.
  origin: (origin, callback) => {
    // Check if the origin is in our allowed list OR if it's undefined (common for same-origin or direct API calls, which we might allow).
    if (ALLOWED_ORIGINS.includes(origin) || !origin) {
      callback(null, true); // true - Allow the request, false- explicitly DISABLES CORS, Browser requests will be blocked even for allowed origins
    } else {
      //   console.log(`CORS Blocked: Request from unauthorized origin: ${origin}`);
      logger.warn("CORS blocked request", { origin });
      callback(new Error("Not allowed by CORS")); // Block the request
    }
  },
  methods: "GET,POST,PUT,DELETE,PATCH", // Specify allowed HTTP methods
  credentials: true, // Allow cookies and authentication headers to be sent
  optionsSuccessStatus: 200, // Best practice for OPTIONS preflight requests
  allowedHeaders: "Content-Type,Authorization,X-XSRF-TOKEN",
};
// 1. Helmet: Use Helmet for general security hardening
// We can pass an empty object to disable a specific header if needed (e.g., if you set a custom CSP)
app.use(
  helmet({
    contentSecurityPolicy: false, // Set to false if you plan to manually configure CSP elsewhere or use the defaults
    crossOriginEmbedderPolicy: false, // Recommended for MERN monoliths
    // crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS: Apply the configured CORS policy
app.use(cors(corsOptions));

//  3. Built-in Express middleware to parse JSON requests
// app.use(express.json({ limit: "10mb" }));
// Increase the limit to 50MB (or higher if needed for Base64 images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// render : --- STATIC FILES ---
// app.use('/assets', express.static(path.join(__dirname, '../frontend/dist/assets')));
// app.use(express.static(path.join(__dirname, "../frontend/dist")));


// Docker : This points to /app/frontend/dist inside Docker
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

// Docker :  Serve static files from the root and assets folder
app.use(express.static(frontendDistPath));
app.use('/assets', express.static(path.join(frontendDistPath, 'assets')));


// app.set("trust proxy", 1); // trust proxy should match deployment,This is OK only if behind Nginx / Load Balancer / Docker, If not behind proxy → remove it.

// MongoDB Connection
// const connectDB = async () => {
//   try {
//     await mongoose.connect(
//       process.env.LOCAL_MONGODB_URI || "mongodb://localhost:27017/pos-db",
//       {
//         maxPoolSize: 10,
//       }
//     );
//     console.log("[LOCAL DB] Connected successfully");

//     await initializeSyncService();

//     if (process.env.CLOUD_MONGODB_URI) {
//       startCloudSync();
//       console.log("[CLOUD SYNC] Background sync started");
//     }
//   } catch (error) {
//     console.error("[LOCAL DB] Connection failed:", error);
//     process.exit(1);
//   }
// };

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.LOCAL_MONGODB_URI  || "mongodb://localhost:27017/pos-db-local",
      {
        maxPoolSize: 10,
      }
    );
    console.log("[LOCAL DB] Connected successfully");

    // await initializeSyncService();
    // console.log("[Sync Service] Initialized - monitoring for data changes");

    // if (process.env.CLOUD_MONGODB_URI) {
    //   startCloudSync();
    //   console.log(
    //     "[CLOUD SYNC] Background sync started (with auto-retry on failure)"
    //   );
    // } else {
    //   console.log(
    //     "[CLOUD SYNC] Cloud MongoDB URI not configured - skipping cloud sync"
    //   );
    // }
  } catch (error) {
    console.error("[LOCAL DB] Connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();

// Sync status endpoint
app.get("/api/sync/status", async (req, res) => {
  const status = await getSyncStatus();
  res.json(status);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "weighbridge-printer-service",
  });
});

// Import routes
import authRoutes from "./routes/auth.route.js";
import itemMasterRoutes from "./routes/itemMaster.route.js";
import saleRoutes from "./routes/sales.route.js";
import customerRoutes from "./routes/customer.route.js";
import purchaseRoutes from "./routes/purchase.route.js";
import salesGSTReportRoutes from "./routes/salesGSTReport.route.js";
import purchaseGSTReportRoutes from "./routes/purchaseGSTReport.route.js";
import expenseRoutes from "./routes/expense.route.js";
import companyRoutes from "./routes/company.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import supplierRoutes from "./routes/supplier.route.js";
import salesPaymentRoutes from "./routes/salesPayment.route.js";
import purchasePaymentRoutes from "./routes/purchasePayment.routes.js";
import reportsRoutes from "./routes/report.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import stockRoutes from "./routes/stock.route.js";

//  API Routes
app.use("/api/auth", authRoutes);
app.use("/api/item_master", itemMasterRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/salesGSTReport", salesGSTReportRoutes);
app.use("/api/purchaseGSTReport", purchaseGSTReportRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/salesPayment", salesPaymentRoutes);
app.use("/api/purchasePayment", purchasePaymentRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/stock", stockRoutes);

// Render : --- FRONTEND HANDLER (Must be AFTER API routes) ---
// app.get('{/*any}', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });

// Docker : The Catch-all (Express 5 syntax)
app.get('{/*any}', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Global error handler
app.use(errorHandler);

// 404 handler
// app.use((req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info(`POS Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});
