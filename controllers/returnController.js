const returnOrder = require("../models/returnModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
const TotalStock = require("../models/totalStockModel");
const Bill = require("../models/billModel");
const totalStockController = require("../controllers/totalStockController");
const stockTransaction = require("../controllers/stockTransactionController");
const Catalogue = require("../models/catModel");
var fs = require("fs");
const moment = require("moment");
const mongoose = require("mongoose");

exports.getReturnNum = catchAsync(async (req, res, next) => {
  const billNo = fs.readFileSync("./public/return.txt", "utf-8");
  res.status(200).json({
    status: "success",
    data: billNo,
  });
  const newBillNum = parseInt(billNo) + 1;
  fs.writeFileSync("./public/return.txt", newBillNum.toString());
});

exports.createReturn = catchAsync(async (req, res, next) => {
  const data = req.body.orders;
  const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");
  const billNum = req.body.billNum.data; // Get billNum from request

  // 1. Fetch the Bill by billNum
  const bill = await Bill.findOne({ billNum });
  if (!bill) {
    return next(new AppError("Bill not found", 404));
  }

  // 2. Stock and Transaction Updates
  for (const orderItem of bill.orders) {
    // Iterate directly over the bill's orders
    console.log(orderItem);
    await totalStockController.returnCreated(orderItem);
    orderItem.transactionType = "Return";
    await stockTransaction.createStock(orderItem);
  }

  // 3. Calculate Price (excluding discount from the original bill)
  let prc = bill.orders.reduce((total, orderItem) => {
    return total + parseFloat(orderItem.meter) * parseFloat(orderItem.rate);
  }, 0);

  // 4. Create Return Order Record
  const returnOrderData = {
    custName: bill.custName,
    custNum: bill.custNum,
    retrnNum: req.body.billNum.data,
    orders: bill.orders, // Use the orders from the fetched bill
    price: prc.toString(),
    startDates: currentDateTime,
  };
  await returnOrder.create(returnOrderData);

  // 5. Delete the Bill from the History
  await Bill.deleteOne({ billNum });

  // 6. Send Response
  res.status(200).json({ data: returnOrderData });
});

exports.validateData = catchAsync(async (req, res, next) => {
  await totalStockController.returnValidate(req, res);
  res.status(200).json({
    status: "success",
  });
});

exports.getSingleReturn = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Object ID", 400));
  }

  const returns = await returnOrder.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      returns,
    },
  });
});

exports.getAllReturn = factory.getAll(returnOrder);
exports.getReturn = factory.getOne(returnOrder);
exports.updateReturn = factory.updateOne(returnOrder);
exports.deleteReturn = factory.deleteOne(returnOrder);

exports.getReturnSearch = catchAsync(async (req, res, next) => {
  const cat = req.params.cat;

  const retrns = await returnOrder.aggregate([
    {
      $match: {
        $or: [
          { custName: cat },
          { custNum: cat },
          { catNum: cat },
          { colNum: cat },
          { meter: cat },
          { startDates: req.params.cat },
        ],
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      retrns,
    },
  });
});
