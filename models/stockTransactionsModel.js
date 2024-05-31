const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  catNum: {
    type: Number,
    required: [true, "A Catalogue must have a name"],
    trim: true,
  },
  colNum: {
    type: String,
    required: [true, "must have a number"],
  },
  transactionType: {
    type: String,
    enum: ["AddStock", "DeleteStock", "Bill", "Return"],
    required: true,
  },
  meter: {
    type: Number,
    required: [true, "must have a meter"],
  },
  rate: {
    type: Number,
    required: true,
  },
  totalCost: {
    type: Number,
    required: true,
  },
  custName: String,
  reason: String,
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  startDates: {
    type: String,
    required: [true, "A tour must have a date"],
  },
  remainingStock: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
