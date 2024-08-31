const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  catNum: {
    type: Number,
    required: [true, "A Catalogue must have a name"],
    trim: true,
  },
  colNum: {
    type: String,
    required: [true, "must have a number"],
  },
  meter: {
    type: Number,
    required: [true, "must have a meter"],
  },
  totalSold: {
    type: Number,
    required: [true, "must have sale"],
  },
  totalHistory: {
    type: Number,
    required: [true, "must have sale"],
  },
  buyingRate: {
    type: Number,
    required: [true, "must have a buying rate"],
  },
  monthlyStockValue: {
    type: Map,
    of: Number,
    default: {},
  },
  monthlyMeterAdded: {
    type: Map,
    of: Number,
    default: {},
  },
  monthlySold: {
    type: Map,
    of: Number,
    default: {},
  },
  monthlySoldValue: {
    type: Map,
    of: Number,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: {
    type: String,
    required: [true, "A tour must have a date"],
  },
});

const TotalStock = mongoose.model("TotalStock", stockSchema);

module.exports = TotalStock;
