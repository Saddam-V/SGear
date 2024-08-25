const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Cust = require("../models/custModel");
const Bill = require("../models/billModel");

exports.createCust = catchAsync(async (req, res, next) => {
  const newobj = {
    custName: req.custName,
    custNum: req.custNum,
    orders: req.orders,
  };
  const newCust = await Cust.create(newobj);
});

exports.getCustDetails = catchAsync(async (req, res, next) => {
  const name = req.params.name;
  const num = req.params.number;

  const currentMonth = new Date().getMonth() + 1;

  const totalBills = await Bill.aggregate([
    {
      $match: {
        custName: { $eq: name },
        // $and: [{ custName: { $regex: name, $options: "i" } }, { custNum: { $regex: num, $options: "i" } }],
      },
    },
  ]);

  const unpaidBills = await Bill.aggregate([
    {
      $match: {
        $and: [
          { custName: { $eq: name } },
          // { custNum: { $regex: num, $options: "i" } },
          { billPaid: false },
          // Filter bills with billPaid flag as false
        ],
      },
    },
  ]);

  const totalSum = totalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const totalDiscount = totalBills.reduce((acc, bill) => {
    const priceDiscount = parseFloat(bill.priceDiscount) || 0;
    return acc + priceDiscount;
  }, 0);

  const currentMonthBills = totalBills.filter((bill) => {
    console.log(currentMonth);
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from startDate
    console.log(billMonth);
    return billMonth === currentMonth;
  });

  // Calculate sum of price and priceDiscount for current month bills
  const unpaidSum = unpaidBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const currentMonthUnpaid = unpaidBills.filter((bill) => {
    // console.log(currentMonth);
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from startDate
    // console.log(billMonth);
    return billMonth === currentMonth;
  });

  // Calculate sum of price and priceDiscount for current month unpaid bills
  const currentMonthUnpaidSum = currentMonthUnpaid.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  // Calculate sum of price and priceDiscount for current month bills
  const currentMonthSum = currentMonthBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const currentMonthDiscount = currentMonthBills.reduce((acc, bill) => {
    const priceDiscount = parseFloat(bill.priceDiscount) || 0;
    return acc + priceDiscount;
  }, 0);

  res.json({
    name,
    num,
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
});

exports.getAllCust = catchAsync(async (req, res, next) => {
  console.log("Headers", req.headers.authorization);
  const features = new APIFeatures(Cust.find(), req.query).filter().sort().limitFields().paginate();
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
