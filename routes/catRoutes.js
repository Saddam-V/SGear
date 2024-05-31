const express = require("express");
const catController = require("../controllers/catController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo("admin"), catController.getAllCat)
  .post(authController.protect, catController.createCat);
router.route("/search/:cat").get(authController.protect, authController.restrictTo("admin"), catController.getCatSearch);
router.put("/updateCatOrders", authController.protect, authController.restrictTo("admin"), catController.updateCatOrders);
// router.route("/validate").post();

router.route("/:id").get(catController.getCat).patch(catController.updateCat).delete(catController.deleteCat);

module.exports = router;
