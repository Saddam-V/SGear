const catchAsync = require("../utils/catchAsync");
const MonthlyDiscount = require("../models/discountModel");

exports.getMonthlyDiscounts = catchAsync(async (req, res, next) => {
  const discounts = await MonthlyDiscount.find();

  res.status(200).json({
    status: "success",
    data: discounts,
  });
});
