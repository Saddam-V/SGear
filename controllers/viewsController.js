const Customer = require("../models/custModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = (req, res) => {
  res.status(200).render("overview", {
    title: "Overview",
  });
};

exports.getCustomer = catchAsync(async (req, res, next) => {
  const customers = await Customer.find();
  console.log(req.headers["customHeader"]);
  res.status(200).render("customer", {
    title: "Customer",
    customers,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render("login", {
    title: "Log into your Account",
  });
});
