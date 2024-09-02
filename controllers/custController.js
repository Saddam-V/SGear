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

    // Calculate total, unpaid, and paid amounts
    const totalSum = totalBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const totalDiscount = totalBills.reduce((acc, bill) => {
      const priceDiscount = parseFloat(bill.priceDiscount) || 0;
      return acc + priceDiscount;
    }, 0);

    const unpaidBills = totalBills.filter((bill) => !bill.billPaid);

    const unpaidSum = unpaidBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      const amountPaid = parseFloat(bill.amount_paid) || 0;
      return acc + (price - amountPaid); // Only add the unpaid portion of each bill
    }, 0);

    const paidBills = totalBills.filter((bill) => bill.billPaid);
    const paidSum = totalSum - unpaidSum;

    // const paidSum = paidBills.reduce((acc, bill) => {
    //   const amountPaid = parseFloat(bill.amount_paid) || 0;
    //   return acc + amountPaid; // Sum up the paid portions of each bill
    // }, 0);

    const currentMonthBills = totalBills.filter((bill) => {
      const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from createdAt
      return billMonth === currentMonth;
    });

    const currentMonthSum = currentMonthBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const currentMonthDiscount = currentMonthBills.reduce((acc, bill) => {
      const priceDiscount = parseFloat(bill.priceDiscount) || 0;
      return acc + priceDiscount;
    }, 0);

    const currentMonthUnpaid = currentMonthBills.filter((bill) => !bill.billPaid);

    const currentMonthUnpaidSum = currentMonthUnpaid.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      const amountPaid = parseFloat(bill.amount_paid) || 0;
      return acc + (price - amountPaid); // Only add the unpaid portion for current month's bills
    }, 0);

    const currentMonthPaidBills = currentMonthBills.filter((bill) => bill.billPaid);

    const currentMonthPaidSum = currentMonthSum - currentMonthUnpaidSum;

    // const currentMonthPaidSum = currentMonthPaidBills.reduce((acc, bill) => {
    //   const amountPaid = parseFloat(bill.amount_paid) || 0;
    //   return acc + amountPaid; // Sum up the paid portions of current month's bills
    // }, 0);

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
      paidBills,
      paidSum,
      currentMonthUnpaidSum,
      currentMonthUnpaid,
      currentMonthPaidBills,
      currentMonthPaidSum,
    });
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return next(new AppError("Error fetching customer details", 500));
  }
});

exports.getMonthlyCustDetails = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;
  const { month, year } = req.query; // Get the desired month and year from query parameters

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return next(new AppError("Invalid customer ID format", 400));
  }

  // Ensure month and year are valid
  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);
  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12 || yearInt < 1970) {
    return next(new AppError("Invalid month or year provided", 400));
  }

  try {
    const customer = await Cust.findById(customerId).exec();
    if (!customer) {
      return next(new AppError("Customer not found", 404));
    }

    const customerName = customer.custName;

    // Calculate the start and end dates for the specified month
    const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the month
    const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59); // End of the month

    // Fetch all bills for the customer in the specified month
    const totalBills = await Bill.aggregate([
      {
        $match: {
          customerId: mongoose.Types.ObjectId(customerId),
          createdAt: { $gte: startDate, $lte: endDate }, // Filter by the specified month
        },
      },
    ]);

    // Perform calculations
    const totalSum = totalBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      return acc + price;
    }, 0);

    const totalDiscount = totalBills.reduce((acc, bill) => {
      const priceDiscount = parseFloat(bill.priceDiscount) || 0;
      return acc + priceDiscount;
    }, 0);

    const unpaidBills = totalBills.filter((bill) => !bill.billPaid);

    const unpaidSum = unpaidBills.reduce((acc, bill) => {
      const price = parseFloat(bill.price) || 0;
      const amountPaid = parseFloat(bill.amount_paid) || 0;
      return acc + (price - amountPaid); // Only add the unpaid portion of each bill
    }, 0);

    const paidBills = totalBills.filter((bill) => bill.billPaid);

    // const paidSum = paidBills.reduce((acc, bill) => {
    //   const amountPaid = parseFloat(bill.amount_paid) || 0;
    //   return acc + amountPaid; // Sum up the paid portions of each bill
    // }, 0);
    const paidSum = totalSum - unpaidSum;

    res.json({
      customerId,
      customerName,
      month: monthInt,
      year: yearInt,
      totalBills,
      totalSum,
      totalDiscount,
      unpaidBills,
      unpaidSum,
      paidBills,
      paidSum,
    });
  } catch (error) {
    console.error("Error fetching monthly customer details:", error);
    return next(new AppError("Error fetching monthly customer details", 500));
  }
});

// exports.getAllCust = catchAsync(async (req, res, next) => {
//   console.log("Headers", req.headers.authorization);
//   const features = new APIFeatures(Cust.find(), req.query).sort();
//   const custs = await features.query;
//   const bills = await Bill.find();

//   const currentMonth = new Date().getMonth() + 1;

//   const unpaidTotalBills = await Bill.aggregate([
//     {
//       $match: {
//         billPaid: false,
//       },
//     },
//   ]);

//   const unpaidTotalSum = unpaidTotalBills.reduce((acc, bill) => {
//     const price = parseFloat(bill.price) || 0;
//     return acc + price;
//   }, 0);

//   const paidTotalBills = await Bill.aggregate([
//     {
//       $match: {
//         billPaid: true,
//       },
//     },
//   ]);

//   const paidTotalSum = paidTotalBills.reduce((acc, bill) => {
//     const price = parseFloat(bill.price) || 0;
//     return acc + price;
//   }, 0);

//   const totalDiscount = bills.reduce((acc, bill) => {
//     const price = parseFloat(bill.priceDiscount) || 0;
//     return acc + price;
//   }, 0);

//   const currentMonthTotalBills = bills.filter((bill) => {
//     // console.log(currentMonth);
//     const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from startDate
//     // console.log(billMonth);
//     return billMonth === currentMonth;
//   });

//   const currentMonthTotalSum = currentMonthTotalBills.reduce((acc, bill) => {
//     const price = parseFloat(bill.price) || 0;
//     return acc + price;
//   }, 0);

//   const currentMonthTotalDiscount = currentMonthTotalBills.reduce((acc, bill) => {
//     const price = parseFloat(bill.priceDiscount) || 0;
//     return acc + price;
//   }, 0);

//   const currentMonthTotalUnpaidBills = unpaidTotalBills.filter((bill) => {
//     // console.log(currentMonth);
//     const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from startDate
//     // console.log(billMonth);
//     return billMonth === currentMonth;
//   });

//   const currentMonthTotalUnpaidSum = currentMonthTotalUnpaidBills.reduce((acc, bill) => {
//     const price = parseFloat(bill.price) || 0;
//     return acc + price;
//   }, 0);

//   res.status(200).json({
//     status: "success",
//     results: custs.length,
//     data: {
//       custs,
//       unpaidTotalSum,
//       unpaidTotalBills,
//       paidTotalBills,
//       paidTotalSum,
//       currentMonthTotalSum,
//       currentMonthTotalBills,
//       currentMonthTotalUnpaidBills,
//       currentMonthTotalUnpaidSum,
//       currentMonthTotalDiscount,
//       totalDiscount,
//     },
//   });
// });

exports.getAllCust = catchAsync(async (req, res, next) => {
  // Log authorization headers for debugging (optional, can be removed)
  console.log("Headers", req.headers.authorization);

  // Fetch all customers with sorting features applied (if any)
  const features = new APIFeatures(Cust.find(), req.query).sort();
  const custs = await features.query;

  // Fetch all bills
  const bills = await Bill.find();

  // Perform calculations
  const totalSum = bills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  const currentMonth = new Date().getMonth() + 1;

  // Get unpaid bills
  const unpaidTotalBills = await Bill.aggregate([
    {
      $match: {
        billPaid: false,
      },
    },
  ]);

  // Calculate total unpaid sum
  const unpaidTotalSum = unpaidTotalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    const amountPaid = parseFloat(bill.amount_paid) || 0;
    return acc + (price - amountPaid); // Only add the unpaid portion
  }, 0);

  // Get paid bills
  const paidTotalBills = await Bill.aggregate([
    {
      $match: {
        billPaid: true,
      },
    },
  ]);

  // Calculate total paid sum
  const paidTotalSum = totalSum - unpaidTotalSum;
  // const paidTotalSum = paidTotalBills.reduce((acc, bill) => {
  //   const amountPaid = parseFloat(bill.amount_paid) || 0;
  //   return acc + amountPaid; // Sum up the paid portions
  // }, 0);

  // Calculate total discount across all bills
  const totalDiscount = bills.reduce((acc, bill) => {
    const priceDiscount = parseFloat(bill.priceDiscount) || 0;
    return acc + priceDiscount;
  }, 0);

  // Filter bills to get those from the current month
  const currentMonthTotalBills = bills.filter((bill) => {
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from createdAt
    return billMonth === currentMonth;
  });

  // Calculate total sum for current month's bills
  const currentMonthTotalSum = currentMonthTotalBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    return acc + price;
  }, 0);

  // Calculate total discount for current month's bills
  const currentMonthTotalDiscount = currentMonthTotalBills.reduce((acc, bill) => {
    const priceDiscount = parseFloat(bill.priceDiscount) || 0;
    return acc + priceDiscount;
  }, 0);

  // Filter unpaid bills for the current month
  const currentMonthTotalUnpaidBills = unpaidTotalBills.filter((bill) => {
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from createdAt
    return billMonth === currentMonth;
  });

  // Calculate total unpaid sum for current month's bills
  const currentMonthTotalUnpaidSum = currentMonthTotalUnpaidBills.reduce((acc, bill) => {
    const price = parseFloat(bill.price) || 0;
    const amountPaid = parseFloat(bill.amount_paid) || 0;
    return acc + (price - amountPaid); // Only add the unpaid portion
  }, 0);

  // Filter paid bills for the current month
  const currentMonthTotalPaidBills = paidTotalBills.filter((bill) => {
    const billMonth = new Date(bill.createdAt).getMonth() + 1; // Extract month from createdAt
    return billMonth === currentMonth;
  });

  // Calculate total paid sum for current month's bills
  const currentMonthTotalPaidSum = currentMonthTotalPaidBills.reduce((acc, bill) => {
    const amountPaid = parseFloat(bill.amount_paid) || 0;
    return acc + amountPaid; // Sum up the paid portions
  }, 0);

  // Return the aggregated results
  res.status(200).json({
    status: "success",
    results: custs.length,
    data: {
      custs,
      totalSum,
      unpaidTotalSum,
      unpaidTotalBills,
      paidTotalBills,
      paidTotalSum,
      totalDiscount,
      currentMonthTotalSum,
      currentMonthTotalBills,
      currentMonthTotalUnpaidBills,
      currentMonthTotalUnpaidSum,
      currentMonthTotalDiscount,
      currentMonthTotalPaidBills,
      currentMonthTotalPaidSum,
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
