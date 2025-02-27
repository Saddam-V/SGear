const express = require("express");
const discountController = require("../controllers/discountController");

const router = express.Router();

router.get("/", discountController.getMonthlyDiscounts);

module.exports = router;
