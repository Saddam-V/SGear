const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.isLoggedIn);

router.get("/", viewsController.getOverview);
router.get("/customer", viewsController.getCustomer);
router.get("/login", viewsController.getLoginForm);

module.exports = router;
