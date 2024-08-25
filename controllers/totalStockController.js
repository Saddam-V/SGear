const TotalStock = require("../models/totalStockModel");
const APIFeatures = require("../utils/apiFeatures");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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
  // req = JSON.parse(req);
  const doc = await TotalStock.findOne({ catNum: req.catNum, colNum: req.colNum });

  // console.log(doc);
  if (doc === null || parseFloat(doc.meter) - parseFloat(req.meter) < 0) {
    return next(new AppError("Catalogue not found", 404));
  } else {
    doc.meter = parseFloat(doc.meter) - parseFloat(req.meter);
    doc.totalSold = parseFloat(doc.totalSold) + parseFloat(req.meter);
    await TotalStock.findOneAndUpdate({ catNum: req.catNum, colNum: req.colNum }, doc, {
      new: true,
      runValidators: true,
    });
  }
});

exports.returnCreated = catchAsync(async (req, res, next) => {
  const doc = await TotalStock.findOne({ catNum: req.catNum, colNum: req.colNum });

  if (doc === null) {
    // TODO: Needs fixing - crash on giving string arguments
    return next(new AppError("not found", 404));
  } else {
    doc.meter = parseFloat(doc.meter) + parseFloat(req.meter);
    doc.totalSold = parseFloat(doc.totalSold) - parseFloat(req.meter);

    await TotalStock.findOneAndUpdate({ catNum: req.catNum, colNum: req.colNum }, doc, {
      new: true,
      runValidators: true,
    });
  }
});

exports.updateStock = catchAsync(async (req, res, next) => {
  await TotalStock.findOne({ catNum: req.body.catNum, colNum: req.body.colNum }, async function (err, doc) {
    // console.log(doc);
    if (doc === null) {
      req.body.totalSold = 0;
      req.body.totalHistory = parseFloat(req.body.meter);
      const newStock = await TotalStock.create(req.body);
    } else {
      doc.meter = parseFloat(req.body.meter) + parseFloat(doc.meter);
      doc.totalHistory = parseFloat(doc.totalHistory) + parseFloat(req.body.meter);
      doc.startDates = req.body.startDates;

      const stock = await TotalStock.findOneAndUpdate({ catNum: req.body.catNum, colNum: req.body.colNum }, doc, {
        new: true,
        runValidators: true,
      });
    }
  });
});

exports.reduceStock = catchAsync(async (req, res, next) => {
  const { catNum, colNum, meter } = req.body;
  const doc = await TotalStock.findOne({ catNum, colNum });
  if (doc) {
    doc.meter -= parseFloat(meter);
    doc.totalHistory -= parseFloat(meter);

    const stock = await TotalStock.findOneAndUpdate({ catNum: catNum, colNum: colNum }, doc, {
      new: true,
      runValidators: true,
    });
  } else {
    return next(new AppError("not found", 404));
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
