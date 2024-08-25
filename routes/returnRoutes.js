const express = require("express");
const returnController = require("../controllers/returnController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo("admin"), returnController.getAllReturn)
  .post(authController.protect, authController.restrictTo("admin"), returnController.createReturn);
router
  .route("/search/:cat")
  .get(authController.protect, authController.restrictTo("admin"), returnController.getReturnSearch);
// router.route("/:id").get(returnController.getReturn).patch(returnController.updateReturn).delete(returnController.deleteReturn);
router.route("/getReturnNum").get(authController.protect, returnController.getReturnNum);
router.route("/validate").post(authController.protect, returnController.validateData);
router.route("/single/:id").get(authController.protect, returnController.getSingleReturn);
module.exports = router;
