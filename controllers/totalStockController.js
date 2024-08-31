const TotalStock = require("../models/totalStockModel");
const APIFeatures = require("../utils/apiFeatures");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const moment = require("moment"); // Use moment.js to handle date formatting

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

exports.billCreated = catchAsync(async (req, res, next) => {
  const currentMonthYear = moment().format("MM-YYYY");
  const { catNum, colNum, meter, rate } = req; // Destructuring rate from request body
  console.log("Entered");
  console.log("rate" + rate);
  const doc = await TotalStock.findOne({ catNum, colNum });

  if (doc === null || parseFloat(doc.meter) - parseFloat(meter) < 0) {
    return next(new AppError("Catalogue not found or insufficient stock", 404));
  } else {
    const meterToReduce = parseFloat(meter);
    const soldValue = meterToReduce * parseFloat(rate);

    // Update meter and total sold
    doc.meter -= meterToReduce;
    doc.totalSold += meterToReduce;

    // Update monthly sold meter
    if (doc.monthlySold.has(currentMonthYear)) {
      doc.monthlySold.set(currentMonthYear, doc.monthlySold.get(currentMonthYear) + meterToReduce);
    } else {
      doc.monthlySold.set(currentMonthYear, meterToReduce);
    }

    // Update monthly sold value
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
});

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
