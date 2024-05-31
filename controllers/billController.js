const APIFeatures = require("../utils/apiFeatures");
const totalStockController = require("../controllers/totalStockController");
const stockTransactionController = require("../controllers/stockTransactionController");
const custController = require("../controllers/custController");
const Bill = require("../models/billModel");
var fs = require("fs");
const Cat = require("../models/catModel");
const Cust = require("../models/custModel");
const moment = require("moment");
const mongoose = require("mongoose");

exports.getunpaid = async (req, res) => {
  try {
    // const bills = await Bill.find();
    const unpaidBills = await Bill.find({
      billPaid: false,
    });

    res.status(200).json({
      status: "success",
      data: {
        unpaidBills,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getunupdatedDiscount = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getinsight = async (req, res) => {
  let startDate, endDate;

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

  // try {
  let bills;
  endDate.setDate(endDate.getDate() + 1);
  // Format the dates to match the format in the database
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  // Query bills with startDates falling within the specified range
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
  });
  // } catch (err) {
  //   res.status(500).json({
  //     status: "error",
  //     message: err.message,
  //   });
  // }
};

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

exports.findRate = async (req, res) => {
  try {
    const doc = await Cat.findOne({ catNum: req.body.catNum });

    if (doc === null) {
      throw "No catalog";
    } else {
      const arr = doc.orders;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].colNum === req.body.colNum) {
          const rate = arr[i].rate;
          res.send(rate.toString());
        }
      }
    }
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.validateData = async (req, res) => {
  // console.log("in validation");
  // console.log(req.body);

  try {
    await totalStockController.billValidate(req, res);
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

exports.getNumber = async (req, res) => {
  try {
    const doc = await Cat.findOne({ catNum: req.params.custName });

    res.status(200).json({
      status: "success",
      data: doc,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getBillNum = async (req, res) => {
  // try {
  const billNo = fs.readFileSync("./public/bill.txt", "utf-8");
  res.status(200).json({
    status: "success",
    data: billNo,
  });
  const newBillNum = parseInt(billNo) + 1;
  fs.writeFileSync("./public/bill.txt", newBillNum.toString());
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err,
  //   });
  // }
};

exports.createBill = async (req, res) => {
  const data = req.body.orders;

  // var str = fs.readFileSync(`${__dirname}/../dev-data/billNo.txt`, "utf8"); // This will block the event loop, not recommended for non-cli programs.
  // console.log("result read: " + str);
  // try {
  const existingBill = await Bill.findOne({ billNum: req.body.billNum.data });
  if (existingBill) {
    // Bill already exists, return success or a specific response
    return res.status(404).json({
      message: "Bill already created",
      data: existingBill, // You might want to return the existing bill data
    });
  }

  for (let index = 0; index < data.length; index++) {
    await totalStockController.billCreated(data[index], res);
    console.log(JSON.parse(data[index]));
    await stockTransactionController.createStock(JSON.parse(data[index]), res);
  }
  let prc = 0;
  for (let index = 0; index < data.length; index++) {
    data[index] = JSON.parse(data[index]);
    prc = prc + parseFloat(data[index].meter) * parseFloat(data[index].rate);
  }

  prc = prc - data[data.length - 1].priceDiscount;

  const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");

  myobj = {
    custName: data[data.length - 1].custName,
    custNum: data[data.length - 1].custNum,
    billNum: req.body.billNum.data,
    orders: data,
    price: prc.toString(),
    priceDiscount: data[data.length - 1].priceDiscount,
    startDates: currentDateTime,
  };
  const doc = await Cust.findOne({ custName: data[0].custName });

  if (doc === null) {
    myobj2 = {
      custName: data[0].custName,
      custNum: data[0].custNum,
    };
    // console.log(myobj2);
    await custController.createCust(myobj, res);
  } else {
    await doc.orders.push(...data);
    await Cust.updateOne({ custName: data[0].custName }, doc);
  }
  await Bill.create(myobj);

  // newstr = parseInt(str) += 1;
  // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, newstr);
  // res.statusMessage = str.toString();
  res.status(200).json({
    data: myobj,
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err,
  //   });
  // }
};

exports.billPaid = async (req, res) => {
  try {
    // Get required data from request body
    const { billNum } = req.body;

    // Validate input data (optional)
    if (!billNum) {
      return res.status(400).json({
        status: "fail",
        message: "Missing required fields: billNum",
      });
    }

    // Find the bill to update
    const bill = await Bill.findOne({ billNum });

    if (bill.billPaid) {
      return res.status(400).json({
        status: "fail",
        message: "This bill has already been paid",
      });
    }

    // Check if bill exists
    if (!bill) {
      return res.status(404).json({
        status: "fail",
        message: "Bill not found",
      });
    }

    // Update price if the bill already has a price
    if (bill.price) {
      bill.billPaid = true;
    } else {
      console.warn("Bill price not found.");
      return res.status(400).json({
        // Return 400 for update failure
        status: "fail",
        message: "Price not found for bill. Update failed.",
      });
    }

    // Save updated bill
    await bill.save();

    // Return updated bill data
    res.status(200).json({
      data: bill,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

exports.updateDiscount = async (req, res) => {
  try {
    // Get required data from request body
    const { billNum, priceDiscount } = req.body;

    // Validate input data (optional)
    if (!billNum || !priceDiscount) {
      return res.status(400).json({
        status: "fail",
        message: "Missing required fields: billNum, priceDiscount",
      });
    }

    // Find the bill to update
    const bill = await Bill.findOne({ billNum });

    if (bill.discountUpdated) {
      return res.status(400).json({
        status: "fail",
        message: "Discount for this bill has already been updated.",
      });
    }

    // Check if bill exists
    if (!bill) {
      return res.status(404).json({
        status: "fail",
        message: "Bill not found",
      });
    }

    // Update price if the bill already has a price
    if (bill.price) {
      bill.price = (parseFloat(bill.price) - parseFloat(priceDiscount)).toString();
      bill.priceDiscount = parseFloat(priceDiscount) + parseFloat(bill.priceDiscount); // Update discount only if price is updated
      bill.discountUpdated = true;
    } else {
      console.warn("Bill price not found. Price and discount cannot be updated.");
      return res.status(400).json({
        // Return 400 for update failure
        status: "fail",
        message: "Price not found for bill. Update failed.",
      });
    }

    // Save updated bill
    await bill.save();

    // Return updated bill data
    res.status(200).json({
      data: bill,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

exports.getAllBill = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(Bill.find(), req.query).filter().sort().limitFields().paginate();
    const bills = await features.query;

    res.status(200).json({
      status: "success",
      results: bills.length,
      data: {
        bills,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    // Bill.findOne({ _id: req.params.id })

    res.status(200).json({
      status: "success",
      data: {
        bill,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        bill,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);

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

exports.getSingleBill = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Check if the provided id is a valid ObjectId
      return res.status(400).json({
        status: "error",
        message: "Invalid ObjectId",
      });
    }

    const bills = await Bill.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(id) },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        bills,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getBillSearch = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
