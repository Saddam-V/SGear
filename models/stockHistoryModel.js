const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  catNum: {
    type: Number,
    required: [true, "A Catalogue must have a name"],
    trim: true,
    // maxlength: [40, "A Catalogue name must have less or equal then 40 characters"],
    // minlength: [10, "A Catalogue name must have more or equal then 10 characters"],
    // validate: [validator.isAlpha, 'Tour name must only contain characters']
  },
  colNum: {
    type: String,
    required: [true, "must have a number"],
  },
  meter: {
    type: Number,
    required: [true, "must have a meter"],
  },
  // priceDiscount: {
  //   type: Number,
  //   validate: {
  //     validator: function (val) {
  //       // this only points to current doc on NEW document creation
  //       return val < this.price;
  //     },
  //     message: "Discount price ({VALUE}) should be below regular price",
  //   },
  // },
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

const StockHistory = mongoose.model("StockHistory", stockSchema);

module.exports = StockHistory;
