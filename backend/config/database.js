import mongoose from "mongoose"
import User from "../models/User.js"
import Item from "../models/Item.js"
import Customer from "../models/Customer.js"
import Purchase from "../models/Purchase.js"
import Sale from "../models/Sale.js"
import SyncQueue from "../models/SyncQueue.js"

export const localDB = mongoose.connection

export const models = {
  User,
  Item,
  Customer,
  Purchase,
  Sale,
  SyncQueue,
}

export default { localDB, models }
