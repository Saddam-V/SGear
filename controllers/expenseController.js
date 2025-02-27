// controllers/expenseController.js
const Expense = require("../models/expenseModel");
const moment = require("moment"); // Use moment.js to handle date formatting

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ dateOfExpense: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Expenses by Month & Year
exports.getExpensesByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;
    const expenses = await Expense.find({ month, year });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
