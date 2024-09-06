const express = require("express");
const billController = require("../controllers/billController");
const authController = require("../controllers/authController");

const router = express.Router();
router
  .route("/")
  .get(authController.protect, billController.getAllBill)
  .post(authController.protect, billController.createBill);
router.route("/search/:cat").get(authController.protect, billController.getBillSearch);
// router.route("/getBillNum").get(authController.protect, billController.getBillNum);
// router.route("/single/:id").get(authController.protect, billController.getSingleBill);

router
  .route("/insight/:start?/:end?")
  .get(authController.protect, authController.restrictTo("admin"), billController.getinsight);
router.route("/unpaid").get(authController.protect, billController.getunpaid);
router.route("/unupdatedDiscount").get(authController.protect, billController.getunupdatedDiscount);

router.route("/validate").post(authController.protect, billController.validateData);
router
  .route("/updateDiscount")
  .post(authController.protect, authController.restrictTo("admin"), billController.updateDiscount);
router.route("/billPaid").post(authController.protect, authController.restrictTo("admin"), billController.billPaid);
router.route("/getNumber/:custName/:custNum?").post(authController.protect, billController.getNumber);
router.route("/findRate").post(authController.protect, billController.findRate);

router
  .route("/:id")
  .get(authController.protect, billController.getSingleBill)
  .patch(authController.protect, authController.restrictTo("admin", "lead-guide"), billController.updateBill)
  .delete(authController.protect, authController.restrictTo("admin", "lead-guide"), billController.deleteBill);

module.exports = router;
