const returnOrder = require("../models/returnModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
const TotalStock = require("../models/totalStockModel");
const Bill = require("../models/billModel");
const MonthlyDiscount = require("../models/discountModel");
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

// exports.createReturn = catchAsync(async (req, res, next) => {
//   const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");
//   const billNum = req.body.billNum; // Get billNum from request

//   console.log(billNum);

//   // 1. Fetch the Bill by billNum
//   const bill = await Bill.findById(billNum);
//   if (!bill) {
//     return next(new AppError("Bill not found", 404));
//   }

//   try {
//     // 2. Stock and Transaction Updates
//     for (const orderItem of bill.orders) {
//       // Iterate directly over the bill's orders
//       orderItem.custName = bill.custName;
//       await totalStockController.returnCreated(orderItem);
//       orderItem.transactionType = "Return";
//     }

//     // 3. Calculate Price (excluding discount from the original bill)
//     let prc = bill.orders.reduce((total, orderItem) => {
//       return total + parseFloat(orderItem.meter) * parseFloat(orderItem.rate);
//     }, 0);

//     // 4. Create Return Order Record
//     const returnOrderData = {
//       custName: bill.custName,
//       custNum: bill.custNum,
//       retrnNum: bill.billNum,
//       orders: bill.orders, // Use the orders from the fetched bill
//       price: prc.toString(),
//       startDates: currentDateTime,
//     };
//     await returnOrder.create(returnOrderData);

//     // 5. Delete the Bill from the History
//     await Bill.deleteOne({ _id: billNum });

//     // 6. Send Response
//     res.status(200).json({ data: returnOrderData });
//   } catch (error) {
//     // Handle errors that occur during stock updates or other operations
//     return next(new AppError("Error processing return", 500));
//   }
// });

exports.createReturn = catchAsync(async (req, res, next) => {
  const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");
  const billNum = req.body.billNum; // Get billNum from request
  const currentMonth = moment().format("MM-YYYY"); // Get current month and year

  console.log(billNum);

  // 1. Fetch the Bill by billNum
  const bill = await Bill.findById(billNum);
  if (!bill) {
    return next(new AppError("Bill not found", 404));
  }

  try {
    // Create a Map to group orders by catNum and colNum
    const orderMap = new Map();

    for (const orderItem of bill.orders) {
      const { catNum, colNum, meter, rate } = orderItem;

      const key = `${catNum}-${colNum}`;

      // Set the transactionType to "Return" and add custName before processing the orderItem
      orderItem.transactionType = "Return";
      orderItem.custName = bill.custName; // Add custName to orderItem

      // If the item already exists in the Map, accumulate its values
      if (orderMap.has(key)) {
        const existingOrder = orderMap.get(key);
        existingOrder.meter += parseFloat(meter);
        existingOrder.rate = rate; // Assuming the rate stays the same
      } else {
        // Otherwise, add the item to the Map
        orderMap.set(key, { ...orderItem, meter: parseFloat(meter) });
      }
    }

    // Now loop through the aggregated orders and update the stock
    for (const [key, orderItem] of orderMap) {
      await totalStockController.returnCreated(orderItem); // Send orderItem with custName to returnCreated
    }

    // Calculate Price (excluding discount from the original bill)
    let prc = [...orderMap.values()].reduce((total, orderItem) => {
      return total + parseFloat(orderItem.meter) * parseFloat(orderItem.rate);
    }, 0);

    // Create Return Order Record
    const returnOrderData = {
      custName: bill.custName,
      custNum: bill.custNum,
      retrnNum: bill.billNum,
      orders: [...orderMap.values()], // Use the aggregated orders
      price: prc.toString(),
      startDates: currentDateTime,
    };
    await returnOrder.create(returnOrderData);

    // Delete the Bill from the History
    await Bill.deleteOne({ _id: billNum });

    // **Key Change: Store Monthly Discount**
    const existingMonthlyDiscount = await MonthlyDiscount.findOne({ month: currentMonth });

    if (existingMonthlyDiscount) {
      existingMonthlyDiscount.totalDiscount -= bill.priceDiscount;
      await existingMonthlyDiscount.save();
    }

    // Send Response
    res.status(200).json({ data: returnOrderData });
  } catch (error) {
    // Handle errors that occur during stock updates or other operations
    return next(new AppError("Error processing return", 500));
  }
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
