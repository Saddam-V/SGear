const StockHistory = require("../models/stockHistoryModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
const totalStockController = require("../controllers/totalStockController");
const Catalogue = require("../models/catModel");
const moment = require("moment");
const Transaction = require("../models/stockTransactionsModel");
const TotalStock = require("../models/totalStockModel");

// Controller for getting all transactions
exports.getAllTransactions = factory.getAll(Transaction);

exports.createStock = catchAsync(async (req, res, next) => {
  if (typeof req === "string") {
    req = JSON.parse(req);
  }
  const { custName, catNum, colNum, meter, reason, transactionType, rate } = req;

  // Extract rate from color entry

  // Calculate total cost
  const totalCost = meter * rate;

  const totalStock = await TotalStock.findOne({ catNum: req.catNum, colNum: req.colNum });

  let remainingStock = totalStock.meter;

  // Create a new transaction
  const newTransaction = await Transaction.create({
    custName,
    catNum,
    colNum,
    transactionType, // Assuming this is an addition to the stock
    meter,
    rate: rate, // Storing the rate as unit price for the transaction
    totalCost,
    reason,
    remainingStock,
    startDates: moment().format("YYYY-MM-DD-HH:mm:ss"),
    // Add other fields from req.body as needed
  });
});
