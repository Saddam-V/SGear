const mongoose = require("mongoose");
const moment = require("moment");

const monthlyDiscountSchema = new mongoose.Schema({
  month: {
    type: String, // Format: MM-YYYY
    required: true,
    unique: true,
  },
  totalDiscount: {
    type: Number,
    default: 0,
  },
});

const MonthlyDiscount = mongoose.model("MonthlyDiscount", monthlyDiscountSchema);

module.exports = MonthlyDiscount;
