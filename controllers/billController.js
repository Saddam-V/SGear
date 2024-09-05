const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const totalStockController = require("../controllers/totalStockController");
const stockTransactionController = require("../controllers/stockTransactionController");
const custController = require("../controllers/custController");
const Bill = require("../models/billModel");
var fs = require("fs");
const Catalogue = require("../models/catModel");
const Cust = require("../models/custModel");
const moment = require("moment");
const mongoose = require("mongoose");
const getBillNum = require("../utils/getBillNum");

exports.getunpaid = catchAsync(async (req, res, next) => {
  const unpaidBills = await Bill.find({
    billPaid: false,
  });

  res.status(200).json({
    status: "success",
    data: {
      unpaidBills,
    },
  });
});

exports.getunupdatedDiscount = catchAsync(async (req, res, next) => {
  // const bills = await Bill.find();
  const unpaidBills = await Bill.find({
    discountUpdated: false,
  });

  res.status(200).json({
    status: "success",
    data: {
      unpaidBills,
    },
  });
});

exports.getinsight = catchAsync(async (req, res, next) => {
  let startDate, endDate;
  console.log(req.params);
  // // Check if start and end dates are provided in the request parameters
  if (req.params.start && req.params.end) {
    startDate = new Date(req.params.start);
    endDate = new Date(req.params.end);
  } else {
    // If start and end dates are not provided, set them to the beginning and end of the current month
    const currentDate = new Date();
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }

  let bills;
  endDate.setDate(endDate.getDate() + 1);
  // Format the dates to match the format in the database
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  // Query bills with startDates falling within the specified range
  console.log(formattedStartDate);
  console.log(formattedEndDate);
  bills = await Bill.find({
    startDates: {
      $gte: formattedStartDate,
      $lt: formattedEndDate,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      bills,
    },
    startDate: formattedStartDate,
    endDate: formattedEndDate,
  });
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());
  return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`;
}

// Function to pad zero to single digit numbers
function padZero(number) {
  return number < 10 ? "0" + number : number;
}

exports.findRate = catchAsync(async (req, res, next) => {
  const doc = await Catalogue.findOne({ catNum: req.body.catNum });

  if (!doc) {
    return next(new AppError("No Catalogue Found to find rate", 404));
  } else {
    const arr = doc.orders;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].colNum === req.body.colNum) {
        const rate = arr[i].rate;
        res.send(rate.toString());
      }
    }
  }
});

exports.validateData = catchAsync(async (req, res, next) => {
  await totalStockController.billValidate(req, res, next);
});

exports.getNumber = catchAsync(async (req, res, next) => {
  const doc = await Catalogue.findOne({ catNum: req.params.custName });

  if (!doc) {
    return next(new AppError("No Customer Found by that name", 404));
  }
  res.status(200).json({
    status: "success",
    data: doc,
  });
});

// const getBillNum = () => {
//   const billNo = fs.readFileSync("./dev-data/billNo.txt", "utf-8");
//   const newBillNum = parseInt(billNo) + 1;
//   fs.writeFileSync("./dev-data/billNo.txt", newBillNum.toString());
//   return billNo;
// };

exports.createBill = catchAsync(async (req, res, next) => {
  const data = req.body.orders;
  let customerName = req.body.customerName.toUpperCase(); // Convert to uppercase
  let customerNumber = req.body.customerNumber.toUpperCase(); // Convert to uppercase
  const discount = req.body.discount;
  const totalPrice = req.body.totalPrice;
  const billNo = await getBillNum();

  // console.log(billNo);
  const existingBill = await Bill.findOne({ billNum: billNo });
  if (existingBill) {
    return next(new AppError("Bill Already Exists", 500)); // Bill already exists, return error
  }

  // Find or create the customer to get the customerId
  let customer = await Cust.findOne({ custName: customerName, custNum: customerNumber });
  let customerId;
  if (!customer) {
    // If customer doesn't exist, create a new customer
    const newCustomer = new Cust({
      custName: customerName,
      custNum: customerNumber,
    });
    customer = await newCustomer.save();
    customerId = customer._id; // Get the new customerId
  } else {
    customerId = customer._id; // Use existing customerId
  }

  const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");

  const myobj = {
    custName: customerName,
    custNum: customerNumber,
    billNum: billNo,
    orders: data,
    price: totalPrice,
    priceDiscount: discount,
    startDates: currentDateTime,
    customerId: customerId, // Add customerId to the bill
  };

  await Bill.create(myobj);

  // Process all orders and ensure that billCreated does not encounter any errors
  for (let order of data) {
    const modifiedOrder = { ...order, custName: customerName };

    try {
      await totalStockController.billCreated(order.catNum, order.colNum, order.meter, order.rate); // Adjusted parameters
      await stockTransactionController.createStock(modifiedOrder); // Passing modified order directly
    } catch (error) {
      return next(error); // Stop processing further if an error is encountered
    }
  }

  // Update customer orders if it already exists
  if (customer) {
    await customer.orders.push(...data);
    await Cust.updateOne({ _id: customerId }, customer);
  }

  res.status(200).json({
    data: myobj,
  });
});

exports.billPaid = catchAsync(async (req, res, next) => {
  const { paymentAmount } = req.body; // Get required data from request body
  const billNum = req.body.id;

  if (!billNum || paymentAmount === undefined) {
    return next(new AppError("Bill Number and Payment Amount are required", 400)); // Validate input data
  }

  const bill = await Bill.findById(billNum); // Find the bill by ID

  if (!bill) {
    return next(new AppError("Bill Not Found", 404)); // Check if bill exists
  }

  if (bill.billPaid) {
    return next(new AppError("This bill is already paid", 400)); // Check if bill is already paid
  }

  // Parse the amounts as floats to handle currency correctly
  const totalAmountDue = parseFloat(bill.price);
  const currentAmountPaid = parseFloat(bill.amount_paid);
  const paymentAmountFloat = parseFloat(paymentAmount);

  if (currentAmountPaid + paymentAmountFloat > totalAmountDue) {
    return next(new AppError("Payment exceeds the total amount due. Update failed", 400)); // Prevent overpayment
  }

  bill.amount_paid = currentAmountPaid + paymentAmountFloat; // Update the total amount paid
  bill.amount_left = totalAmountDue - bill.amount_paid;

  if (bill.amount_paid >= totalAmountDue) {
    bill.billPaid = true; // Mark the bill as paid if the amount paid meets or exceeds the total amount due
    bill.discountUpdated = true; // Mark the bill as paid if the amount paid meets or exceeds the total amount due
  }

  await bill.save(); // Save updated bill

  res.status(200).json({
    data: bill, // Return updated bill data
  });
});

exports.updateDiscount = catchAsync(async (req, res, next) => {
  // Get required data from request body
  const { priceDiscount } = req.body;
  const billNum = req.body.id;

  // Validate input data (optional)
  if (!billNum || !priceDiscount) {
    return next(new AppError("Bill Number or Discount price is missing", 500));
  }

  // Find the bill to update
  const bill = await Bill.findById(billNum);

  if (bill.discountUpdated) {
    return next(new AppError("Discount for this bill has already been paid", 500));
  }

  // Check if bill exists
  if (!bill) {
    return next(new AppError("Bill not found", 404));
  }

  // Update price if the bill already has a price
  if (bill.price) {
    bill.price = (parseFloat(bill.price) - parseFloat(priceDiscount)).toString();
    bill.priceDiscount = parseFloat(priceDiscount) + parseFloat(bill.priceDiscount); // Update discount only if price is updated
    bill.discountUpdated = true;
  } else {
    return next(new AppError("Bill price not found. Price and discount cannot be updated.", 404));
  }

  // Save updated bill
  await bill.save();

  // Return updated bill data
  res.status(200).json({
    data: bill,
  });
});

exports.getAllBill = factory.getAll(Bill);
exports.updateBill = factory.updateOne(Bill);
exports.deleteBill = factory.deleteOne(Bill);
exports.getSingleBill = factory.getOne(Bill);

exports.getBillSearch = catchAsync(async (req, res, next) => {
  const cat = req.params.cat;

  const bills = await Bill.aggregate([
    {
      $match: {
        $or: [
          { custName: { $regex: cat, $options: "i" } }, // Case-insensitive substring match
          { custNum: { $regex: cat, $options: "i" } },
          { startDates: { $regex: cat, $options: "i" } },
        ],
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      bills,
    },
  });
});
