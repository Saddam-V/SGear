const express = require("express");
const custController = require("../controllers/custController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(custController.getAllCust)
  .post(authController.protect, authController.restrictTo("admin"), custController.createCust);
router
  .route("/search/:cat")
  .get(authController.protect, authController.restrictTo("admin"), custController.getCustSearch);
router
  .route("/custDetails/:id")
  .get(authController.protect, authController.restrictTo("admin"), custController.getCustDetails);
router
  .route("/custMonthlyDetails/:id")
  .get(authController.protect, authController.restrictTo("admin"), custController.getMonthlyCustDetails);

router.route("/getCustNum/:custName").get(authController.protect, custController.getCustNum);

// router.route("/:id").get(custController.getCat).patch(custController.updateCat).delete(custController.deleteCat);

module.exports = router;
