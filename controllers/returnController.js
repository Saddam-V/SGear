const returnOrder = require("../models/returnModel");
const APIFeatures = require("../utils/apiFeatures");
const TotalStock = require("../models/totalStockModel");
const Bill = require("../models/billModel");
const totalStockController = require("../controllers/totalStockController");
const stockTransaction = require("../controllers/stockTransactionController");
const Cat = require("../models/catModel");
var fs = require("fs");
const moment = require("moment");
const mongoose = require("mongoose");

exports.getReturnNum = async (req, res) => {
  // try {
  const billNo = fs.readFileSync("./public/return.txt", "utf-8");
  res.status(200).json({
    status: "success",
    data: billNo,
  });
  const newBillNum = parseInt(billNo) + 1;
  fs.writeFileSync("./public/return.txt", newBillNum.toString());
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err,
  //   });
  // }
};

// exports.createReturn = async (req, res) => {
//   try {
//     // console.log("Creating returnOrder");
//     // console.log(req.body);

//     const doc = await Cat.findOne({ catNum: req.body.catNum });
//     const totalStockDoc = await TotalStock.findOne({ catNum: req.body.catNum, colNum: req.body.colNum });

//     // console.log(totalStockDoc);
//     if (doc === null) {
//       // TODO: Needs fixing - crash on giving string arguments
//       throw 404;
//     } else {
//       totalStockDoc.meter = parseFloat(totalStockDoc.meter) + parseFloat(req.body.meter);
//       totalStockDoc.totalSold = parseFloat(totalStockDoc.totalSold) - parseFloat(req.body.meter);
//       // console.log("this is doc");
//       // console.log(totalStockDoc);
//       await TotalStock.findOneAndUpdate({ catNum: req.body.catNum, colNum: req.body.colNum }, totalStockDoc, {
//         new: true,
//         runValidators: true,
//       });
//     }

//     if (doc === null) {
//       throw "No catalog";
//     } else {
//       const arr = doc.orders;
//       for (let i = 0; i < arr.length; i++) {
//         if (arr[i].colNum === req.body.colNum) {
//           const rate = arr[i].rate;
//           req.body.rate = rate;
//           await returnOrder.create(req.body);

//           res.status(201).json({
//             status: "success",
//           });
//         }
//       }
//     }
//   } catch (err) {
//     res.status(400).json({
//       status: "failed",
//       message: err,
//     });
//   }
// };

// exports.createReturn = async (req, res) => {
//   const data = req.body.orders;
//   const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");

//   try {
//     for (let index = 0; index < data.length; index++) {
//       await totalStockController.returnCreated(data[index], res);
//       await stockTransaction.createStock(JSON.parse(data[index]), res);
//     }
//     let prc = 0;
//     for (let index = 0; index < data.length; index++) {
//       data[index] = JSON.parse(data[index]);
//       prc = prc + parseFloat(data[index].meter) * parseFloat(data[index].rate);
//     }

//     myobj = {
//       custName: data[data.length - 1].custName,
//       custNum: data[data.length - 1].custNum,
//       retrnNum: req.body.billNum.data,
//       orders: data,
//       price: prc.toString(),
//       // priceDiscount: data[data.length - 1].priceDiscount,
//       startDates: currentDateTime,
//     };

//     console.log(myobj);
//     await returnOrder.create(myobj);

//     res.status(200).json({
//       data: myobj,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

exports.createReturn = async (req, res) => {
  const data = req.body.orders;
  const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");
  const billNum = req.body.billNum.data; // Get billNum from request

  // try {
  // 1. Fetch the Bill by billNum
  const bill = await Bill.findOne({ billNum });
  if (!bill) {
    return res.status(404).json({ status: "fail", message: "Bill not found" });
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
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).json({
  //     // Use 500 for server errors
  //     status: "fail",
  //     message: "An error occurred while processing the return", // More generic error message
  //   });
  // }
};

exports.validateData = async (req, res) => {
  // console.log("in validation");
  // console.log(req.body);

  try {
    await totalStockController.returnValidate(req, res);
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getSingleReturn = async (req, res) => {
  // try {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    // Check if the provided id is a valid ObjectId
    return res.status(400).json({
      status: "error",
      message: "Invalid ObjectId",
    });
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
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err,
  //   });
  // }
};

exports.getAllReturn = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(returnOrder.find(), req.query).filter().sort().limitFields().paginate();
    const retrns = await features.query;

    console.log(retrns[0].orders);

    res.status(200).json({
      status: "success",
      results: retrns.length,
      data: {
        retrns,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getReturn = async (req, res) => {
  try {
    const retrn = await returnOrder.findById(req.params.id);
    // returnOrder.findOne({ _id: req.params.id })

    res.status(200).json({
      status: "success",
      data: {
        retrn,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateReturn = async (req, res) => {
  try {
    const retrn = await returnOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        retrn,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteReturn = async (req, res) => {
  try {
    await returnOrder.findByIdAndDelete(req.params.id);

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

exports.getReturnSearch = async (req, res) => {
  try {
    const cat = req.params.cat;
    // console.log(cat);

    const retrns = await returnOrder.aggregate([
      {
        $match: {
          $or: [{ custName: cat }, { custNum: cat }, { catNum: cat }, { colNum: cat }, { meter: cat }, { startDates: req.params.cat }],
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        retrns,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
