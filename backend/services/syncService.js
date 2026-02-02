import mongoose from "mongoose"
import { startBackgroundSync, isCloudConnected } from "./mongoCloudSync.js"

const SyncQueueSchema = new mongoose.Schema(
  {
    collection: String, 
    operation: { type: String, enum: ["create", "update", "delete"] },
    documentId: String,
    data: mongoose.Schema.Types.Mixed,
    synced: { type: Boolean, default: false },
    syncedAt: Date,
    localTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const SyncQueue = mongoose.model("SyncQueue", SyncQueueSchema)

// Initialize sync service
export const initializeSyncService = async () => {
  console.log("[Sync Service] Initialized - monitoring for data changes")

  // Start background sync if cloud URI is configured
  if (process.env.CLOUD_MONGODB_URI) {
    startBackgroundSync()
  }
}

// Add operation to sync queue
export const addToSyncQueue = async (collection, operation, documentId, data) => {
  try {
    const syncEntry = new SyncQueue({
      collection,
      operation,
      documentId,
      data,
      synced: false,
      localTimestamp: new Date(),
    })
    await syncEntry.save()
    console.log(`[Sync Queue] Added ${operation} operation for ${collection}:${documentId}`)
    return syncEntry
  } catch (error) {
    console.error("[Sync Queue] Error adding to queue:", error)
  }
}

// Get pending sync items
export const getPendingSyncItems = async () => {
  try {
    const pending = await SyncQueue.find({ synced: false }).sort({ localTimestamp: 1 }).limit(100)
    return pending
  } catch (error) {
    console.error("[Sync Service] Error fetching pending items:", error)
    return []
  }
}

// Mark item as synced
export const markAsSynced = async (syncId) => {
  try {
    await SyncQueue.findByIdAndUpdate(syncId, {
      synced: true,
      syncedAt: new Date(),
    })
    console.log(`[Sync Service] Marked ${syncId} as synced`)
  } catch (error) {
    console.error("[Sync Service] Error marking as synced:", error)
  }
}

// Get sync status
export const getSyncStatus = async () => {
  try {
    const total = await SyncQueue.countDocuments()
    const pending = await SyncQueue.countDocuments({ synced: false })
    const synced = await SyncQueue.countDocuments({ synced: true })

    return {
      total,
      pending,
      synced,
      isSyncing: pending > 0,
    }
  } catch (error) {
    console.error("[Sync Service] Error getting status:", error)
    return { total: 0, pending: 0, synced: 0, isSyncing: false }
  }
}

// Clear synced items (optional cleanup)
export const clearSyncedItems = async (daysOld = 7) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    const result = await SyncQueue.deleteMany({
      synced: true,
      syncedAt: { $lt: cutoffDate },
    })
    console.log(`[Sync Service] Cleaned up ${result.deletedCount} old synced items`)
    return result
  } catch (error) {
    console.error("[Sync Service] Error clearing synced items:", error)
  }
}

export const startCloudSync = () => {
  if (process.env.CLOUD_MONGODB_URI) {
    startBackgroundSync()
  }
}

// Get cloud sync status
export const getCloudSyncStatus = async () => {
  const isConnected = await isCloudConnected()
  const syncStatus = await getSyncStatus()

  return {
    ...syncStatus,
    cloudConnected: isConnected,
    mode: "Local MongoDB with Cloud Sync",
  }
}
