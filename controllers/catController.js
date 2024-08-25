const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const Catalogue = require("../models/catModel");
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
  res.redirect(`/api/v1/Catalogue/${savedCatalogue._id}`);
});

exports.addOrderToCatalogue = catchAsync(async (req, res, next) => {
  const catalogueId = req.params.id;
  const { colNum, rate, confirmUpdate } = req.body;

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

  // Add new order if colNum does not exist
  catalogue.orders.push({ colNum, rate });
  await catalogue.save();

  res.status(200).json({
    status: "success",
    message: "Order added successfully",
    data: {
      catalogue,
    },
  });
});

exports.getAllCat = factory.getAll(Catalogue);
exports.getCat = factory.getOne(Catalogue);
exports.updateCat = factory.updateOne(Catalogue);
exports.deleteCat = factory.deleteOne(Catalogue);

// Function to Update rate
exports.updateCatOrders = catchAsync(async (req, res, next) => {
  const { catNum, colNum, updatedRate } = req.body;
  // Find the Cat document based on catNum
  const catToUpdate = await Catalogue.findOne({ catNum });

  console.log(catToUpdate);
  if (catToUpdate) {
    // Update rate for all orders if colNum is not provided
    if (!colNum) {
      catToUpdate.orders.forEach((order) => (order.rate = updatedRate));
    } else {
      // Update rate for specific colNum if provided
      const orderIndex = catToUpdate.orders.findIndex((order) => order.colNum === colNum);
      if (orderIndex !== -1) {
        catToUpdate.orders[orderIndex].rate = updatedRate;
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
