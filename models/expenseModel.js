// models/Expense.js
const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, enum: ["Cash", "Card", "Bank Transfer", "Other"] },
    paidTo: { type: String },
    dateOFExpense: {
      type: String, // Storing as a string in "MM-YYYY" format
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
