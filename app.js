const express = require("express");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const stockHistoryRouter = require("./routes/stockHistoryRoutes");
const stockTransactionRouter = require("./routes/stockTransactionRoutes");
const totalStockRouter = require("./routes/totalStockRouter");
const billRouter = require("./routes/billRoutes");
const catRouter = require("./routes/catRoutes");
const custRouter = require("./routes/custRoutes");
const returnRouter = require("./routes/returnRoutes");
const userRouter = require("./routes/userRoutes");
const expenseRouter = require("./routes/expenseRoutes");
const discountRouter = require("./routes/discountRoutes");
const cookieParser = require("cookie-parser");
const compression = require("compression");

// const userRouter = require("./routes/userRoutes");

const app = express();

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(compression());

// 3) ROUTES
app.use("/api/v1/history", stockHistoryRouter);
app.use("/api/v1/transaction", stockTransactionRouter);
app.use("/api/v1/total", totalStockRouter);
app.use("/api/v1/bill", billRouter);
app.use("/api/v1/catalogue/", catRouter);
app.use("/api/v1/customer/", custRouter);
app.use("/api/v1/return/", returnRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/monthlyDiscounts", discountRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
