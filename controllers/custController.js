const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Cust = require("../models/custModel");
const Bill = require("../models/billModel");
const mongoose = require("mongoose");

exports.createCust = catchAsync(async (req, res, next) => {
  const newobj = {
    custName: req.custName,
    custNum: req.custNum,
    orders: req.orders,
  };
  const newCust = await Cust.create(newobj);
});

exports.getCustDetails = catchAsync(async (req, res, next) => {
  const customerId = req.params.id; // Use id to search for customer data
  // console.log(`Received customerId: ${customerId}`);

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return next(new AppError("Invalid customer ID format", 400));
  }

  const currentMonth = new Date().getMonth() + 1;

  try {
    // Fetch customer details
    const customer = await Cust.findById(customerId).exec();
    if (!customer) {
      return next(new AppError("Customer not found", 404));
    }

    const customerName = customer.custName;

    const totalBills = await Bill.aggregate([
      {
        $match: {
          customerId: mongoose.Types.ObjectId(customerId), // Ensure ObjectId format
        },
      },
    ]);
    // console.log(`Total Bills: ${JSON.stringify(totalBills)}`);

    const unpaidBills = await Bill.aggregate([
      {
        $match: {
          $and: [
            { customerId: mongoose.Types.ObjectId(customerId) },
            { billPaid: false }, // Filter unpaid bills
          ],
        },
      },
    ]);
    // console.log(`Unpaid Bills: ${JSON.stringify(unpaidBills)}`);

    const totalSum = totalBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const totalDiscount = totalBills.reduce((acc, bill) => {
      const priceDiscount = parseFloat(bill.priceDiscount) || 0;
      return acc + priceDiscount;
    }, 0);

    const currentMonthBills = totalBills.filter((bill) => {
      const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from createdAt
      return billMonth === currentMonth;
    });

    const unpaidSum = unpaidBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const currentMonthUnpaid = unpaidBills.filter((bill) => {
      const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from createdAt
      return billMonth === currentMonth;
    });

    const currentMonthUnpaidSum = currentMonthUnpaid.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const currentMonthSum = currentMonthBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const currentMonthDiscount = currentMonthBills.reduce((acc, bill) => {
      const priceDiscount = parseFloat(bill.priceDiscount) || 0;
      return acc + priceDiscount;
    }, 0);

    res.json({
      customerId,
      customerName, // Include customer name in the response
      totalBills,
      currentMonthBills,
      totalSum,
      totalDiscount,
      currentMonthDiscount,
      currentMonthSum,
      unpaidBills,
      unpaidSum,
      currentMonthUnpaidSum,
      currentMonthUnpaid,
    });
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return next(new AppError("Error fetching customer details", 500));
  }
});

exports.getAllCust = catchAsync(async (req, res, next) => {
  console.log("Headers", req.headers.authorization);
  const features = new APIFeatures(Cust.find(), req.query).sort();
  const custs = await features.query;
  const bills = await Bill.find();

  const currentMonth = new Date().getMonth() + 1;

  const unpaidTotalBills = await Bill.aggregate([
    {
      $match: {
        billPaid: false,
      },
    },
  ]);

  const unpaidTotalSum = unpaidTotalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const paidTotalBills = await Bill.aggregate([
    {
      $match: {
        billPaid: true,
      },
    },
  ]);

  const paidTotalSum = paidTotalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const totalDiscount = bills.reduce((acc, bill) => {
    const price = parseFloat(bill.priceDiscount) || 0;
    return acc + price;
  }, 0);

  const currentMonthTotalBills = bills.filter((bill) => {
    // console.log(currentMonth);
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from startDate
    // console.log(billMonth);
    return billMonth === currentMonth;
  });

  const currentMonthTotalSum = currentMonthTotalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const currentMonthTotalDiscount = currentMonthTotalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.priceDiscount) || 0;
    return acc + price;
  }, 0);

  const currentMonthTotalUnpaidBills = unpaidTotalBills.filter((bill) => {
    // console.log(currentMonth);
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from startDate
    // console.log(billMonth);
    return billMonth === currentMonth;
  });

  const currentMonthTotalUnpaidSum = currentMonthTotalUnpaidBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  res.status(200).json({
    status: "success",
    results: custs.length,
    data: {
      custs,
      unpaidTotalSum,
      unpaidTotalBills,
      paidTotalBills,
      paidTotalSum,
      currentMonthTotalSum,
      currentMonthTotalBills,
      currentMonthTotalUnpaidBills,
      currentMonthTotalUnpaidSum,
      currentMonthTotalDiscount,
      totalDiscount,
    },
  });
});

exports.getCustSearch = catchAsync(async (req, res, next) => {
  const cat = req.params.cat;

  const custs = await Cust.aggregate([
    {
      $match: { $or: [{ custName: cat }, { custNum: cat }, { startDates: cat }] },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      custs,
    },
  });
});
