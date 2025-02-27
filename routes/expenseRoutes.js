// Register Routes (in routes/expenseRoutes.js)
const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

router.post("/", expenseController.createExpense);
router.get("/", expenseController.getExpenses);
router.get("/:month/:year", expenseController.getExpensesByMonth);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
