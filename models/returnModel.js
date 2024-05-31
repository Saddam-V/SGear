const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  custName: {
    type: String,
    required: [true, "must have a name"],
    trim: true,
    // maxlength: [40, "A Catalogue name must have less or equal then 40 characters"],
    // minlength: [10, "A Catalogue name must have more or equal then 10 characters"],
    // validate: [validator.isAlpha, 'Tour name must only contain characters']
  },
  custNum: {
    type: String,
  },
  catNum: {
    type: String,
    required: [false, "must have a number"],
  },
  colNum: {
    type: String,
    required: [false, "must have a number"],
  },
  meter: {
    type: Number,
    required: [false, "must have a meter"],
  },
  rate: {
    type: Number,
    required: [false, "must have a meter"],
  },
  orders: {
    type: Array,
    required: [true, "must have"],
  },
  retrnNum: {
    type: Number,
    required: [true, "must have a number"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: {
    type: String,
    default: new Date().toISOString().slice(0, 10),
  },
  price: {
    type: Number,
    required: [true, "A tour must have a price"],
  },
});

const returnOrder = mongoose.model("returnOrder", returnSchema);

module.exports = returnOrder;
