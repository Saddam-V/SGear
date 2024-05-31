const StockHistory = require("../models/stockHistoryModel");
const TotalStock = require("../models/totalStockModel");
const StockTransction = require("../models/stockTransactionsModel");
const APIFeatures = require("../utils/apiFeatures");
const totalStockController = require("../controllers/totalStockController");
const stockTransaction = require("../controllers/stockTransactionController");
const Cat = require("../models/catModel");
const moment = require("moment");

exports.reduceStock = async (req, res) => {
  try {
    console.log("in stock history");
    await totalStockController.reduceStock(req, res);
    req.body.rate = 0;
    req.body.transactionType = "DeleteStock";
    req.body.custName = req.body.reason;
    await stockTransaction.createStock(req.body, res);

    res.status(200).json({
      status: "success", // Send back the updated cat document
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createStock = async (req, res) => {
  // try {
  catNum = req.body.catNum;
  const catalog = await Cat.findOne({ catNum });
  if (!catalog) {
    throw "Catalog not found";
  }

  // Find the color entry in the catalog
  const colorEntry = await catalog.orders.find((order) => order.colNum === req.body.colNum);
  if (!colorEntry) {
    throw "Color not found in the catalog";
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
  // } catch (err) {
  //   res.status(400).json({
  //     status: "failed",
  //     message: err,
  //   });
  // }
};

exports.getAllStock = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(StockHistory.find(), req.query).filter().sort().limitFields().paginate();
    const stocks = await features.query;

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
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getStock = async (req, res) => {
  try {
    const stock = await StockHistory.findById(req.params.id);
    // StockHistory.findOne({ _id: req.params.id })

    res.status(200).json({
      status: "success",
      data: {
        stock,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await StockHistory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        stock,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    await StockHistory.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getStockHistorySearch = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
