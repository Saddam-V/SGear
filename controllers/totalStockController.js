const TotalStock = require("../models/totalStockModel");
const APIFeatures = require("../utils/apiFeatures");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const moment = require("moment"); // Use moment.js to handle date formatting
const stockTransaction = require("../controllers/stockTransactionController");

exports.createStock = factory.createOne(TotalStock);
exports.getAllStock = factory.getAll(TotalStock);
exports.getStock = factory.getOne(TotalStock);

exports.billValidate = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const doc = await TotalStock.findOne({ catNum: req.body.catNum, colNum: req.body.colNum });
  if (doc === null || parseFloat(doc.meter) - parseFloat(req.body.meter) < 0) {
    console.log(doc);
    console.log(parseFloat(doc.meter) - parseFloat(req.body.meter));
    return next(new AppError("not found", 404));
  } else {
    res.status(200).json({
      status: "success",
    });
  }
});

exports.returnValidate = catchAsync(async (req, res, next) => {
  const doc = await TotalStock.findOne({ catNum: req.body.catNum, colNum: req.body.colNum });
  if (doc === null) {
    return next(new AppError("not found", 404));
  }
});

// Assume that billCreated now accepts individual parameters instead of req, res, next
exports.billCreated = async (catNum, colNum, meter, rate) => {
  const currentMonthYear = moment().format("MM-YYYY");

  const doc = await TotalStock.findOne({ catNum, colNum });
  if (doc === null || parseFloat(doc.meter) - parseFloat(meter) < 0) {
    throw new AppError("Catalogue not found or insufficient stock", 404);
  } else {
    const meterToReduce = Math.round(parseFloat(meter) * 100) / 100; // Rounding meter to 2 decimal points
    const soldValue = Math.round(meterToReduce * parseFloat(rate) * 100) / 100; // Rounding sold value to 2 decimal points

    doc.meter -= meterToReduce;
    doc.totalSold += meterToReduce;

    if (doc.monthlySold.has(currentMonthYear)) {
      doc.monthlySold.set(currentMonthYear, doc.monthlySold.get(currentMonthYear) + meterToReduce);
    } else {
      doc.monthlySold.set(currentMonthYear, meterToReduce);
    }

    if (doc.monthlySoldValue.has(currentMonthYear)) {
      doc.monthlySoldValue.set(currentMonthYear, doc.monthlySoldValue.get(currentMonthYear) + soldValue);
    } else {
      doc.monthlySoldValue.set(currentMonthYear, soldValue);
    }

    await TotalStock.findOneAndUpdate({ catNum: catNum, colNum: colNum }, doc, {
      new: true,
      runValidators: true,
    });
  }
};

exports.returnCreated = catchAsync(async (req, res, next) => {
  const currentMonthYear = moment().format("MM-YYYY");
  const { catNum, colNum, meter, rate } = req; // Destructuring to get the rate

  const doc = await TotalStock.findOne({ catNum, colNum });

  if (doc === null) {
    return next(new AppError("Catalogue not found", 404));
  } else {
    const meterToAdd = parseFloat(meter);
    const valueToSubtract = meterToAdd * parseFloat(rate);

    // Update meter and total sold
    doc.meter += meterToAdd;
    doc.totalSold -= meterToAdd;

    // Update monthly sold meter
    if (doc.monthlySold.has(currentMonthYear)) {
      const newSoldValue = doc.monthlySold.get(currentMonthYear) - meterToAdd;
      doc.monthlySold.set(currentMonthYear, newSoldValue < 0 ? 0 : newSoldValue); // Ensure it doesn't go below zero
    }

    // Update monthly sold value
    if (doc.monthlySoldValue.has(currentMonthYear)) {
      const newSoldValue = doc.monthlySoldValue.get(currentMonthYear) - valueToSubtract;
      doc.monthlySoldValue.set(currentMonthYear, newSoldValue < 0 ? 0 : newSoldValue); // Ensure it doesn't go below zero
    }

    await TotalStock.findOneAndUpdate({ catNum: catNum, colNum: colNum }, doc, {
      new: true,
      runValidators: true,
    });

    await stockTransaction.createStock(req);

    // res.status(200).json({
    //   status: "success",
    //   data: doc,
    // });
  }
});

exports.updateStock = catchAsync(async (req, res, next) => {
  const currentMonthYear = moment().format("MM-YYYY");
  const { catNum, colNum, meter, buyingRate, startDates } = req.body;

  await TotalStock.findOne({ catNum, colNum }, async function (err, doc) {
    if (doc === null) {
      req.body.totalSold = 0;
      req.body.totalHistory = parseFloat(meter);
      req.body.buyingRate = buyingRate;
      req.body.monthlyStockValue = {
        [currentMonthYear]: parseFloat(meter) * parseFloat(buyingRate),
      };
      req.body.monthlyMeterAdded = {
        [currentMonthYear]: parseFloat(meter),
      };

      const newStock = await TotalStock.create(req.body);
    } else {
      const addedStockValue = parseFloat(meter) * parseFloat(buyingRate);
      const addedMeter = parseFloat(meter);

      doc.meter = addedMeter + parseFloat(doc.meter);
      doc.totalHistory = parseFloat(doc.totalHistory) + addedMeter;
      doc.startDates = startDates;
      doc.buyingRate = buyingRate;

      // Update or initialize monthly stock value
      if (doc.monthlyStockValue.has(currentMonthYear)) {
        doc.monthlyStockValue.set(currentMonthYear, doc.monthlyStockValue.get(currentMonthYear) + addedStockValue);
      } else {
        doc.monthlyStockValue.set(currentMonthYear, addedStockValue);
      }

      // Update or initialize monthly meter added
      if (doc.monthlyMeterAdded.has(currentMonthYear)) {
        doc.monthlyMeterAdded.set(currentMonthYear, doc.monthlyMeterAdded.get(currentMonthYear) + addedMeter);
      } else {
        doc.monthlyMeterAdded.set(currentMonthYear, addedMeter);
      }

      await TotalStock.findOneAndUpdate({ catNum, colNum }, doc, {
        new: true,
        runValidators: true,
      });

      await stockTransaction.createStock(req.body, res);
    }
  });
});

exports.reduceStock = catchAsync(async (req, res, next) => {
  const { catNum, colNum, meter, buyingRate } = req.body;
  const currentMonthYear = moment().format("MM-YYYY");
  const doc = await TotalStock.findOne({ catNum, colNum });

  if (doc) {
    const meterToReduce = parseFloat(meter);

    if (doc.meter < meterToReduce) {
      return next(new AppError("Insufficient stock", 400));
    }

    doc.meter -= meterToReduce;
    doc.totalHistory -= meterToReduce;

    // Update monthly stock value
    if (doc.monthlyStockValue.has(currentMonthYear)) {
      const currentStockValue = doc.monthlyStockValue.get(currentMonthYear);
      const updatedStockValue = currentStockValue - meterToReduce * buyingRate;

      // Ensure the monthly stock value does not go below zero
      doc.monthlyStockValue.set(currentMonthYear, Math.max(updatedStockValue, 0));
    }

    // Update monthly meter added
    if (doc.monthlyMeterAdded.has(currentMonthYear)) {
      const currentMeterAdded = doc.monthlyMeterAdded.get(currentMonthYear);
      const updatedMeterAdded = currentMeterAdded - meterToReduce;

      // Ensure the monthly meter added does not go below zero
      doc.monthlyMeterAdded.set(currentMonthYear, Math.max(updatedMeterAdded, 0));
    }

    await TotalStock.findOneAndUpdate({ catNum: catNum, colNum: colNum }, doc, {
      new: true,
      runValidators: true,
    });

    // res.status(200).json({
    //   status: "success",
    //   data: doc,
    // });
    await stockTransaction.createStock(req.body, res);
  } else {
    return next(new AppError("Catalogue not found", 404));
  }
});

exports.deleteStock = factory.deleteOne(TotalStock);

exports.getTotalStockSearch = catchAsync(async (req, res, next) => {
  const cat = req.params.cat * 1;
  const col = req.params.col;

  let stocks;

  if (col === "undefined") {
    stocks = await TotalStock.aggregate([
      {
        $match: { catNum: cat },
      },
    ]);
  } else {
    stocks = await TotalStock.aggregate([
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

exports.totalInsight = catchAsync(async (req, res, next) => {
  const currentMonthYear = moment().format("MM-YYYY");
  const lastMonthYear = moment().subtract(1, "months").format("MM-YYYY");
  const twoMonthsAgoYear = moment().subtract(2, "months").format("MM-YYYY");
  const threeMonthsAgoYear = moment().subtract(3, "months").format("MM-YYYY");
  const fourMonthsAgoYear = moment().subtract(4, "months").format("MM-YYYY");

  // Fetch all documents to perform calculations
  const allStocks = await TotalStock.find();

  // Initialize the variables for insights
  let totalMeterAdded = 0;
  let totalMeterAddedThisMonth = 0;
  let totalValueStockAdded = 0;
  let totalValueStockAddedThisMonth = 0;
  let totalMeterSold = 0;
  let totalMeterSoldThisMonth = 0;
  let totalValueSold = 0;
  let totalValueSoldThisMonth = 0;
  let profitThisMonth = 0;
  let profitLastMonth = 0;
  let profitTwoMonthsAgo = 0;
  let profitThreeMonthsAgo = 0;
  let profitFourMonthsAgo = 0;
  let mostAddedClothes = [];
  let mostAddedClothesThisMonth = [];
  let mostSoldClothes = [];
  let mostSoldClothesThisMonth = [];
  let leastSoldClothes = [];
  let leastSoldClothesThisMonth = [];
  let mostProfitableClothes = [];
  let mostProfitableClothesThisMonth = [];
  let maxProfit = 0;

  // Temporary variables to find most and least values
  const addedMetrics = [];
  const addedThisMonthMetrics = [];
  const soldMetrics = [];
  const soldThisMonthMetrics = [];
  const profitableMetrics = [];
  const overallProfitableMetrics = [];

  allStocks.forEach((stock) => {
    // Calculate total meter added and total value of stock added
    totalMeterAdded += [...stock.monthlyMeterAdded.values()].reduce((a, b) => a + b, 0);
    totalValueStockAdded += [...stock.monthlyStockValue.values()].reduce((a, b) => a + b, 0);

    // Calculate total meter added and total value of stock added this month
    const addedThisMonth = stock.monthlyMeterAdded.get(currentMonthYear) || 0;
    const valueAddedThisMonth = stock.monthlyStockValue.get(currentMonthYear) || 0;
    totalMeterAddedThisMonth += addedThisMonth;
    totalValueStockAddedThisMonth += valueAddedThisMonth;

    // Calculate total meter sold and total value sold
    totalMeterSold += [...stock.monthlySold.values()].reduce((a, b) => a + b, 0);
    totalValueSold += [...stock.monthlySoldValue.values()].reduce((a, b) => a + b, 0);

    // Calculate total meter sold and total value sold this month
    const soldThisMonth = stock.monthlySold.get(currentMonthYear) || 0;
    const valueSoldThisMonth = stock.monthlySoldValue.get(currentMonthYear) || 0;
    totalMeterSoldThisMonth += soldThisMonth;
    totalValueSoldThisMonth += valueSoldThisMonth;

    // Calculate profit for this month, last month, and two months ago
    const profitCurrent = valueSoldThisMonth - valueAddedThisMonth;
    const profitPrevious =
      (stock.monthlySoldValue.get(lastMonthYear) || 0) - (stock.monthlyStockValue.get(lastMonthYear) || 0);
    const profitTwoAgo =
      (stock.monthlySoldValue.get(twoMonthsAgoYear) || 0) - (stock.monthlyStockValue.get(twoMonthsAgoYear) || 0);
    const profitThreeAgo =
      (stock.monthlySoldValue.get(threeMonthsAgoYear) || 0) - (stock.monthlyStockValue.get(threeMonthsAgoYear) || 0);
    const profitFourAgo =
      (stock.monthlySoldValue.get(fourMonthsAgoYear) || 0) - (stock.monthlyStockValue.get(fourMonthsAgoYear) || 0);
    profitThisMonth += profitCurrent;
    profitLastMonth += profitPrevious;
    profitTwoMonthsAgo += profitTwoAgo;
    profitThreeMonthsAgo += profitThreeAgo;
    profitFourMonthsAgo += profitFourAgo;

    // Calculate overall profit for the item across all months
    const overallProfit = [...stock.monthlySoldValue.entries()].reduce((total, [monthYear, soldValue]) => {
      const stockValue = stock.monthlyStockValue.get(monthYear) || 0;
      return total + (soldValue - stockValue);
    }, 0);

    // Collect metrics for sorting
    addedMetrics.push({
      catNum: stock.catNum,
      colNum: stock.colNum,
      totalAdded: [...stock.monthlyMeterAdded.values()].reduce((a, b) => a + b, 0),
    });
    addedThisMonthMetrics.push({ catNum: stock.catNum, colNum: stock.colNum, addedThisMonth });
    soldMetrics.push({
      catNum: stock.catNum,
      colNum: stock.colNum,
      totalSold: [...stock.monthlySold.values()].reduce((a, b) => a + b, 0),
    });
    soldThisMonthMetrics.push({ catNum: stock.catNum, colNum: stock.colNum, soldThisMonth });
    profitableMetrics.push({ catNum: stock.catNum, colNum: stock.colNum, profitCurrent });
    overallProfitableMetrics.push({ catNum: stock.catNum, colNum: stock.colNum, overallProfit });

    // Determine most/least added/sold clothes

    if (profitCurrent > maxProfit) {
      maxProfit = profitCurrent;
      mostProfitableClothes = stock;
    }
  });

  // Sort metrics and get top 5
  const topAdded = addedMetrics.sort((a, b) => b.totalAdded - a.totalAdded).slice(0, 5);
  const topAddedThisMonth = addedThisMonthMetrics.sort((a, b) => b.addedThisMonth - a.addedThisMonth).slice(0, 5);
  const topSold = soldMetrics.sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
  const topSoldThisMonth = soldThisMonthMetrics.sort((a, b) => b.soldThisMonth - a.soldThisMonth).slice(0, 5);
  const leastSold = soldMetrics.sort((a, b) => a.totalSold - b.totalSold).slice(0, 5);
  const leastSoldThisMonth = soldThisMonthMetrics.sort((a, b) => a.soldThisMonth - b.soldThisMonth).slice(0, 5);
  const topProfitable = profitableMetrics.sort((a, b) => b.profitCurrent - a.profitCurrent).slice(0, 5);
  const topOverallProfitable = overallProfitableMetrics.sort((a, b) => b.overallProfit - a.overallProfit).slice(0, 5);
  // Sort the array by profit and get the top 5 items

  res.status(200).json({
    status: "success",
    insights: {
      totalMeterAdded,
      totalMeterAddedThisMonth,
      totalValueStockAdded,
      totalValueStockAddedThisMonth,
      totalMeterSold,
      totalMeterSoldThisMonth,
      totalValueSold,
      totalValueSoldThisMonth,
      profitThisMonth,
      profitLastMonth,
      profitTwoMonthsAgo,
      profitThreeMonthsAgo,
      profitFourMonthsAgo,
      mostAddedClothes: topAdded,
      mostAddedClothesThisMonth: topAddedThisMonth,
      mostSoldClothes: topSold,
      mostSoldClothesThisMonth: topSoldThisMonth,
      leastSoldClothes: leastSold,
      leastSoldClothesThisMonth: leastSoldThisMonth,
      mostProfitableClothes: topProfitable,
      mostProfitableClothesOverall: topOverallProfitable,
    },
  });
});
