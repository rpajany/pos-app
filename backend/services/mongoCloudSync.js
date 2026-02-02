import mongoose from "mongoose"
import { getPendingSyncItems, markAsSynced } from "./syncService.js"

import User from "../models/User.model.js"
import Item from "../models/Item.js"
import Customer from "../models/Customer.js"
import Purchase from "../models/Purchase.js"
import Sale from "../models/Sale.js"

let cloudConnection = null

const getModelFromName = (collection) => {
  const models = {
    users: User,
    items: Item,
    customers: Customer,
    purchases: Purchase,
    sales: Sale,
  }
  return models[collection]
}

const getFullDocument = async (collection, documentId) => {
  try {
    const Model = getModelFromName(collection)
    if (!Model) {
      console.warn(`[SYNC] Unknown collection: ${collection}`)
      return null
    }
    const doc = await Model.findById(documentId).lean()
    return doc
  } catch (error) {
    console.error(`[SYNC] Failed to fetch document:`, error.message)
    return null
  }
}

// Connect to Cloud MongoDB
export const connectToCloud = async () => {
  if (cloudConnection) return cloudConnection

  try {
    cloudConnection = await mongoose.createConnection(process.env.CLOUD_MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    })
    console.log("[CLOUD CONNECTION] Connected to cloud MongoDB")
    return cloudConnection
  } catch (error) {
    console.error("[CLOUD CONNECTION] Failed to connect:", error.message)
    cloudConnection = null
    return null
  }
}

export const syncChangeToCloud = async (change) => {
  const cloudConn = await connectToCloud()
  if (!cloudConn) {
    console.warn("[CLOUD SYNC] Cloud connection unavailable, will retry later")
    return false
  }

  try {
    const { collection, operation, documentId } = change

    // Fetch the full document from local DB
    const fullDocument = await getFullDocument(collection, documentId)
    if (!fullDocument && operation !== "delete") {
      console.warn(`[CLOUD SYNC] Document not found locally: ${collection}/${documentId}`)
      return false
    }

    // Get the model from cloud connection
    const LocalModel = getModelFromName(collection)
    if (!LocalModel) {
      console.warn(`[CLOUD SYNC] Unknown collection: ${collection}`)
      return false
    }

    // Create cloud model with same schema
    const CloudModel = cloudConn.model(collection, LocalModel.schema)

    if (operation === "create") {
      await CloudModel.create({
        _id: fullDocument._id,
        ...(fullDocument.toObject ? fullDocument.toObject() : fullDocument),
        syncedFromLocal: true,
        localSyncedAt: new Date(),
      })
    } else if (operation === "update") {
      await CloudModel.findByIdAndUpdate(
        documentId,
        {
          ...(fullDocument.toObject ? fullDocument.toObject() : fullDocument),
          syncedFromLocal: true,
          localSyncedAt: new Date(),
        },
        { upsert: true, new: true },
      )
    } else if (operation === "delete") {
      await CloudModel.findByIdAndDelete(documentId)
    }

    console.log(`[CLOUD SYNC] ${operation} synced: ${collection}/${documentId}`)
    return true
  } catch (error) {
    console.error(`[CLOUD SYNC] Error syncing to cloud:`, error.message)
    return false
  }
}

// Background sync worker
export const startBackgroundSync = async () => {
  console.log("[BACKGROUND SYNC] Worker started - syncing every 10 seconds")

  setInterval(async () => {
    try {
      // Check if online
      const cloudConn = await connectToCloud()
      if (!cloudConn) {
        console.log("[BACKGROUND SYNC] Offline - waiting for connection")
        return
      }

      // Get pending changes from local DB
      const pending = await getPendingSyncItems()
      if (pending.length === 0) return

      console.log(`[BACKGROUND SYNC] Found ${pending.length} pending changes`)

      // Sync each change
      let successCount = 0
      for (const change of pending) {
        const synced = await syncChangeToCloud(change)
        if (synced) {
          await markAsSynced(change._id)
          successCount++
        }
      }

      console.log(`[BACKGROUND SYNC] Successfully synced ${successCount}/${pending.length} changes`)
    } catch (error) {
      console.error("[BACKGROUND SYNC] Error:", error.message)
    }
  }, 10000) // Sync every 10 seconds
}

// Check cloud connection status
export const isCloudConnected = async () => {
  const conn = await connectToCloud()
  return conn !== null
}
