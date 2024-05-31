const express = require("express");
const custController = require("../controllers/custController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo("admin"), custController.getAllCust)
  .post(authController.protect, authController.restrictTo("admin"), custController.createCust);
router.route("/search/:cat").get(authController.protect, authController.restrictTo("admin"), custController.getCustSearch);
router.route("/custDetails/:name?/:number?").get(authController.protect, authController.restrictTo("admin"), custController.getCustDetails);

// router.route("/validate").post();

// router.route("/:id").get(custController.getCat).patch(custController.updateCat).delete(custController.deleteCat);

module.exports = router;
