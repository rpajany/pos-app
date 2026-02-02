import express from "express"
import { getPendingSyncItems, markAsSynced, clearSyncedItems, getCloudSyncStatus } from "../services/syncService.js"
import { verifyToken } from "../middleware/auth.middleware.js"

const router = express.Router()

// Get current sync status
router.get("/status", verifyToken, async (req, res) => {
  try {
    const status = await getCloudSyncStatus()
    res.json(status)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get pending items to sync
router.get("/pending", verifyToken, async (req, res) => {
  try {
    const pending = await getPendingSyncItems()
    res.json(pending)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Apply pending changes from offline client
router.post("/apply-changes", verifyToken, async (req, res) => {
  const { changes } = req.body

  if (!Array.isArray(changes)) {
    return res.status(400).json({ error: "Changes must be an array" })
  }

  const results = []

  for (const change of changes) {
    try {
      const { collection, operation, documentId, data, timestamp } = change

      const result = {
        id: documentId,
        collection,
        operation,
        success: false,
      }

      // Handle different collections
      switch (collection) {
        case "items":
          const Item = require("../models/Item.js").default
          if (operation === "create") {
            await Item.create(data)
          } else if (operation === "update") {
            await Item.findByIdAndUpdate(documentId, data)
          } else if (operation === "delete") {
            await Item.findByIdAndDelete(documentId)
          }
          break

        case "customers":
          const Customer = require("../models/Customer.js").default
          if (operation === "create") {
            await Customer.create(data)
          } else if (operation === "update") {
            await Customer.findByIdAndUpdate(documentId, data)
          } else if (operation === "delete") {
            await Customer.findByIdAndDelete(documentId)
          }
          break

        case "sales":
          const Sale = require("../models/Sale.js").default
          if (operation === "create") {
            await Sale.create(data)
          } else if (operation === "update") {
            await Sale.findByIdAndUpdate(documentId, data)
          }
          break

        case "purchases":
          const Purchase = require("../models/Purchase.js").default
          if (operation === "create") {
            await Purchase.create(data)
          } else if (operation === "update") {
            await Purchase.findByIdAndUpdate(documentId, data)
          }
          break
      }

      result.success = true
      await markAsSynced(change.syncId)
      results.push(result)
    } catch (error) {
      results.push({
        id: change.documentId,
        collection: change.collection,
        operation: change.operation,
        success: false,
        error: error.message,
      })
    }
  }

  res.json({ synced: results.length, results })
})

// Clear old synced records (cleanup)
router.post("/cleanup", verifyToken, async (req, res) => {
  try {
    const { daysOld = 7 } = req.body
    const result = await clearSyncedItems(daysOld)
    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
