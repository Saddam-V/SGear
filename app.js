const express = require("express");
const morgan = require("morgan");
const stockHistoryRouter = require("./routes/stockHistoryRoutes");
const stockTransactionRouter = require("./routes/stockTransactionRoutes");
const totalStockRouter = require("./routes/totalStockRouter");
const billRouter = require("./routes/billRoutes");
const catRouter = require("./routes/catRoutes");
const custRouter = require("./routes/custRoutes");
const returnRouter = require("./routes/returnRoutes");
const userRouter = require("./routes/userRoutes");
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

app.use("/api/v1/stockHistory", stockHistoryRouter);
app.use("/api/v1/stockTransaction", stockTransactionRouter);
app.use("/api/v1/totalStock", totalStockRouter);
app.use("/api/v1/bill", billRouter);
app.use("/api/v1/cat/", catRouter);
app.use("/api/v1/cust/", custRouter);
app.use("/api/v1/return/", returnRouter);
app.use("/api/v1/users", userRouter);

// app.use("/api/v1/users", userRouter);

module.exports = app;
