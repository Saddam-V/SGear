const mongoose = require("mongoose");
const moment = require("moment");

const orderSchema = new mongoose.Schema({
  colNum: { type: String, trim: true, required: [true, "Order must have a Column Number"] },
  rate: { type: Number, trim: true, required: [true, "Order must have a Rate"] },
});

const catalogueSchema = new mongoose.Schema({
  catNum: { type: String, trim: true, required: [true, "Catalogue must have a Catalogue Number"] },
  catName: { type: String, trim: true },
  date: { type: Date, default: Date.now }, // Automatically set to today's date
  startDates: {
    type: String,
    default: () => moment().format("YYYY-MM-DD-HH:mm:ss"), // Set default value using moment
    required: [true, "must have a date"],
  },
  orders: { type: [orderSchema], default: [] },
});

const Cat = mongoose.model("Cat", catalogueSchema);

module.exports = Cat;
