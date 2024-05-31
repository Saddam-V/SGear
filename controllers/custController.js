const APIFeatures = require("../utils/apiFeatures");
const Cust = require("../models/custModel");
const Bill = require("../models/billModel");

exports.createCust = async (req, res) => {
  //   try {
  // const newCust = new Cust({})
  // newCust.save()
  const newobj = {
    custName: req.custName,
    custNum: req.custNum,
    orders: req.orders,
  };
  const newCust = await Cust.create(newobj);
  //   } catch (err) {
  //     throw err;
  //   }
};

exports.getCustDetails = async (req, res) => {
  // try {
  console.log("in");
  const name = req.params.name;
  console.log(name);
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

  ////

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

  // Include the totalSum in the response
  // console.log(
  //   totalBills,
  //   currentMonthBills,
  //   totalSum,
  //   totalDiscount,
  //   currentMonthDiscount,
  //   currentMonthSum,
  //   unpaidBills,
  //   unpaidSum,
  //   currentMonthUnpaidSum
  // );
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
  // } catch (err) {
  //   res.status(500).json({ message: err.message });
  // }
};

exports.getAllCust = async (req, res) => {
  // try {
  // EXECUTE QUERY
  const features = new APIFeatures(Cust.find(), req.query).filter().sort().limitFields().paginate();
  const custs = await features.query;
  // const featuresBill = new APIFeatures(Bill.find(), req.query).filter().sort().limitFields().paginate();
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
  // } catch (err) {
  //   res.status(400).json({
  //     status: "failed",
  //     message: err,
  //   });
  // }
};

exports.getCustSearch = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
