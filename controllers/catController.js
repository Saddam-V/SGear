const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const Catalogue = require("../models/catModel");
const TotalStock = require("../models/totalStockModel");
var fs = require("fs");
const moment = require("moment");
const { nextTick } = require("process");

exports.createCat = catchAsync(async (req, res, next) => {
  // Check if catNum exists
  const catNum = req.body.catNum;
  const existingCatalogue = await Catalogue.findOne({ catNum });
  if (existingCatalogue) return next(new AppError("Catalogue Already Exists", 500));

  const newCatalogue = new Catalogue({ catNum: req.body.catNum, catName: req.body.catName, orders: [] });
  const savedCatalogue = await newCatalogue.save();
  if (!savedCatalogue) return next(new AppError("Error Saving Catalogue Entry", 500));
  res.redirect(`/api/v1/catalogue/${savedCatalogue._id}`);
});

exports.addOrderToCatalogue = catchAsync(async (req, res, next) => {
  const catalogueId = req.body.id;
  console.log(catalogueId + " is here");
  const { colNum, rate, buyingRate, confirmUpdate } = req.body;

  const catalogue = await Catalogue.findById(catalogueId);
  if (!catalogue) return next(new AppError("Catalogue not found", 404));

  // Check if colNum already exists
  const existingOrder = catalogue.orders.find((order) => order.colNum === colNum);

  if (existingOrder) {
    if (confirmUpdate) {
      // Update the rate of the existing colNum
      existingOrder.rate = rate;
      await catalogue.save();
      return res.status(200).json({
        status: "success",
        message: "Order rate updated successfully",
        data: {
          catalogue,
        },
      });
    } else {
      // Return response to prompt user for confirmation
      return next(new AppError("Order with this colNum already exists. Do you want to update the rate?", 409));
    }
  }

  if (!colNum || !rate || !buyingRate) {
    return next(new AppError("Compulsory fields missing"));
  }

  console.log(buyingRate);
  // Add new order if colNum does not exist
  catalogue.orders.push({ colNum, rate, buyingRate });
  console.log(catalogue.orders);
  await catalogue.save();

  res.status(200).json({
    status: "success",
    message: "Order added successfully",
    data: {
      catalogue,
    },
  });
});

exports.deleteOrderFromCatalogue = catchAsync(async (req, res, next) => {
  const catalogueId = req.body.id;
  const { colNum } = req.body;

  console.log(`${catalogueId} and ${colNum} are here`);

  const catalogue = await Catalogue.findById(catalogueId);
  if (!catalogue) return next(new AppError("Catalogue not found", 404));

  // Find the index of the order with the given colNum
  const orderIndex = catalogue.orders.findIndex((order) => order.colNum === colNum);

  if (orderIndex === -1) {
    return next(new AppError("Order with this colNum does not exist", 404));
  }

  // Remove the order from the orders array
  catalogue.orders.splice(orderIndex, 1);
  await catalogue.save();

  res.status(200).json({
    status: "success",
    message: "Order deleted successfully",
    data: {
      catalogue,
    },
  });
});

exports.getSingleCat = catchAsync(async (req, res, next) => {
  // Fetch the catalogue by its ID from params
  const catalogue = await Catalogue.findById(req.params.id);

  // If the catalogue is not found, return an error
  if (!catalogue) {
    return next(new AppError("No catalogue found with that ID", 404));
  }

  // Fetch corresponding TotalStock data for the catNum of the catalogue
  const totalStocks = await TotalStock.find({ catNum: String(catalogue.catNum) });

  // Initialize monthly data
  const monthlyData = {
    monthlyStockValue: {},
    monthlyMeterAdded: {},
    monthlySold: {},
    monthlySoldValue: {},
  };

  // Function to convert a Map to a plain object (handling null/undefined maps)
  const mapToObject = (map) => {
    const obj = {};
    if (map && typeof map.forEach === "function") {
      map.forEach((value, key) => {
        obj[key] = value;
      });
    }
    return obj;
  };

  // Aggregate data by month
  totalStocks.forEach((stock) => {
    // Convert Maps to plain objects (handle undefined fields gracefully)
    const stockValue = mapToObject(stock.monthlyStockValue || new Map());
    const meterAdded = mapToObject(stock.monthlyMeterAdded || new Map());
    const sold = mapToObject(stock.monthlySold || new Map());
    const soldValue = mapToObject(stock.monthlySoldValue || new Map());

    // Iterate over the months in stockValue (assuming other maps follow the same structure)
    Object.keys(stockValue).forEach((month) => {
      if (!monthlyData.monthlyStockValue[month]) {
        monthlyData.monthlyStockValue[month] = 0;
        monthlyData.monthlyMeterAdded[month] = 0;
        monthlyData.monthlySold[month] = 0;
        monthlyData.monthlySoldValue[month] = 0;
      }

      monthlyData.monthlyStockValue[month] += stockValue[month] || 0;
      monthlyData.monthlyMeterAdded[month] += meterAdded[month] || 0;
      monthlyData.monthlySold[month] += sold[month] || 0;
      monthlyData.monthlySoldValue[month] += soldValue[month] || 0;
    });
  });

  // Convert monthly data to arrays of objects
  const monthlyDataArray = Object.keys(monthlyData.monthlyStockValue).map((month) => ({
    month,
    totalStockValue: monthlyData.monthlyStockValue[month],
    totalMeterAdded: monthlyData.monthlyMeterAdded[month],
    totalSold: monthlyData.monthlySold[month],
    totalSoldValue: monthlyData.monthlySoldValue[month],
  }));

  // Send the response
  res.status(200).json({
    status: "success",
    data: {
      catNum: catalogue.catNum,
      catName: catalogue.catName,
      monthlyData: monthlyDataArray,
    },
  });
});

exports.getAllCat = factory.getAll(Catalogue);
exports.getCat = factory.getOne(Catalogue);
exports.updateCat = factory.updateOne(Catalogue);
exports.deleteCat = factory.deleteOne(Catalogue);

// Function to Update rate
exports.updateCatOrders = catchAsync(async (req, res, next) => {
  const { catNum, colNum, updatedRate, updatedBuyingRate } = req.body;
  // Find the Cat document based on catNum
  const catToUpdate = await Catalogue.findOne({ catNum });

  console.log(catToUpdate);
  if (catToUpdate) {
    // Update rate and buyingRate for all orders if colNum is not provided
    if (!colNum) {
      catToUpdate.orders.forEach((order) => {
        if (updatedRate !== undefined) {
          order.rate = updatedRate;
        }
        if (updatedBuyingRate !== undefined) {
          order.buyingRate = updatedBuyingRate;
        }
      });
    } else {
      // Update rate and buyingRate for a specific colNum if provided
      const orderIndex = catToUpdate.orders.findIndex((order) => order.colNum === colNum);
      if (orderIndex !== -1) {
        if (updatedRate !== undefined) {
          catToUpdate.orders[orderIndex].rate = updatedRate;
        }
        if (updatedBuyingRate !== undefined) {
          catToUpdate.orders[orderIndex].buyingRate = updatedBuyingRate;
        }
      } else {
        throw "Column number not found for this catNum";
      }
    }

    // Stringify orders array and the whole object before saving
    catToUpdate.orders = catToUpdate.orders;
    const catToUpdateStringified = JSON.stringify(catToUpdate);

    // Save the updated document
    const savedCat = await Catalogue.findByIdAndUpdate(catToUpdate._id, JSON.parse(catToUpdateStringified), {
      new: true,
    });

    console.log(savedCat);

    res.status(200).json({
      status: "success",
      data: savedCat, // Send back the updated cat document
    });
  } else {
    throw "Cat not found";
  }
});
