const express = require("express");
const catController = require("../controllers/catController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo("admin"), catController.getAllCat)
  .post(authController.protect, catController.createCat);

router.post(
  "/updateCatOrders",
  authController.protect,
  authController.restrictTo("admin"),
  catController.updateCatOrders
);

router
  .post("/addOrder", catController.addOrderToCatalogue)
  .put("/addOrder", authController.protect, authController.restrictTo("admin"), catController.addOrderToCatalogue);
// router.route("/validate").post();

router.route("/:id").get(catController.getCat).patch(catController.updateCat).delete(catController.deleteCat);

module.exports = router;
