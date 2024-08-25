const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const StockHistory = require("../models/stockHistoryModel");
const TotalStock = require("../models/totalStockModel");
const StockTransction = require("../models/stockTransactionsModel");
const APIFeatures = require("../utils/apiFeatures");
const totalStockController = require("../controllers/totalStockController");
const stockTransaction = require("../controllers/stockTransactionController");
const Catalogue = require("../models/catModel");
const moment = require("moment");

exports.reduceStock = catchAsync(async (req, res, next) => {
  // console.log("in stock history");
  await totalStockController.reduceStock(req, res);
  req.body.rate = 0;
  req.body.transactionType = "DeleteStock";
  req.body.custName = req.body.reason;
  await stockTransaction.createStock(req.body, res);

  res.status(200).json({
    status: "success", // Send back the updated cat document
  });
});

exports.createStock = catchAsync(async (req, res, next) => {
  catNum = req.body.catNum;
  const catalog = await Catalogue.findOne({ catNum });
  if (!catalog) {
    return next(new AppError("Catalog not found", 404));
  }

  // Find the color entry in the catalog
  const colorEntry = await catalog.orders.find((order) => order.colNum === req.body.colNum);
  if (!colorEntry) {
    return next(new AppError("Color not found in the catalog", 404));
  }

  req.body.rate = colorEntry.rate;

  req.body.startDates = moment().format("YYYY-MM-DD-HH:mm:ss");
  await totalStockController.updateStock(req, res);
  const newStock = await StockHistory.create(req.body);
  res.status(200).json({
    status: "success",
    data: {
      stock: newStock,
    },
  });
  await stockTransaction.createStock(req.body, res);
});

exports.getAllStock = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(StockHistory.find(), req.query).filter().sort().limitFields().paginate();
  const stocks = await features.query;

  if (!stocks) {
    return next(new AppError("No Stocks Found", 404));
  }
  // const totalFeatures = new APIFeatures(TotalStock.find(), req.query).filter().sort().limitFields().paginate();
  const totalStocks = await TotalStock.find();

  let lessStocks = totalStocks.filter((stock) => stock.meter < 15);

  res.status(200).json({
    status: "success",
    results: stocks.length,
    data: {
      stocks,
      lessStocks,
    },
  });
});

exports.getStock = factory.getOne(StockHistory);
exports.updateStock = factory.updateOne(StockHistory);
exports.deleteStock = factory.deleteOne(StockHistory);

exports.getStockHistorySearch = catchAsync(async (req, res, next) => {
  const cat = req.params.cat * 1;
  const col = req.params.col;
  let stocks;
  // console.log(cat);
  if (col === "undefined") {
    stocks = await StockTransction.aggregate([
      {
        $match: { $or: [{ catNum: cat }, { colNum: cat }, { meter: cat }, { startDates: req.params.cat }] },
      },
    ]);
  } else {
    console.log("in 2");
    stocks = await StockTransction.aggregate([
      {
        $match: { catNum: cat, colNum: col },
      },
    ]);
  }

  res.status(200).json({
    status: "success",
    data: {
      stocks,
    },
  });
});
