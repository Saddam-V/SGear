const express = require("express");
const stockHistoryController = require("../controllers/stockHistoryController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, stockHistoryController.getAllStock)
  .post(authController.protect, stockHistoryController.createStock);
router.route("/search/:cat/:col?").get(authController.protect, stockHistoryController.getStockHistorySearch);
router.route("/reduceStock").post(authController.protect, authController.restrictTo("admin"), stockHistoryController.reduceStock);
// router
//   .route("/:id")
//   .get(stockHistoryController.getStock)
//   .patch(stockHistoryController.updateStock)
//   .delete(stockHistoryController.deleteStock);

module.exports = router;
