const express = require("express");
const stockTransactionController = require("../controllers/stockTransactionController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, stockTransactionController.getAllTransactions)
  .post(authController.protect, stockTransactionController.createStock);
// router.route("/search/:cat/:col?").get(authController.protect, stockHistoryController.getStockHistorySearch);
// router
//   .route("/:id")
//   .get(stockHistoryController.getStock)
//   .patch(stockHistoryController.updateStock)
//   .delete(stockHistoryController.deleteStock);

module.exports = router;
