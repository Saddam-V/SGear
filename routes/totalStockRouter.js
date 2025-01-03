const express = require("express");
const totalStockController = require("../controllers/totalStockController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo("admin"), totalStockController.getAllStock)
  .post(authController.protect, totalStockController.createStock);
router.route("/search/:cat/:col?").get(authController.protect, totalStockController.getTotalStockSearch);

router
  .route("/totalInsight")
  .get(authController.protect, authController.restrictTo("admin"), totalStockController.totalInsight);
// router.route("/:id").get(totalStockController.getStock).patch(totalStockController.updateStock).delete(totalStockController.deleteStock);

module.exports = router;
