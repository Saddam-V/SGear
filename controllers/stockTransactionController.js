const StockHistory = require("../models/stockHistoryModel");
const APIFeatures = require("../utils/apiFeatures");
const totalStockController = require("../controllers/totalStockController");
const Cat = require("../models/catModel");
const moment = require("moment");
const Transaction = require("../models/stockTransactionsModel");
const TotalStock = require("../models/totalStockModel");

// Controller for getting all transactions
exports.getAllTransactions = async (req, res) => {
  // try {
  const features = new APIFeatures(Transaction.find(), req.query).filter().sort().limitFields().paginate();
  const stocks = await features.query;
  res.status(200).json({
    status: "success",
    data: {
      stocks,
    },
  });
  // } catch (error) {
  //   res.status(400).json({ error: error.message });
  // }
};

exports.createStock = async (req) => {
  try {
    const { custName, catNum, colNum, meter, reason, transactionType, rate } = req;

    // Extract rate from color entry

    // Calculate total cost
    const totalCost = meter * rate;

    console.log(req, req.catNum, req.colNum);

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
  } catch (err) {
    throw err;
  }
};
