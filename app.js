const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const crypto = require("crypto");
const cors = require("cors");

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
const cookieParser = require("cookie-parser");
const viewRouter = require("./routes/viewRoutes");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Using Cors
app.use(cors());
// {
//     origin: "http://localhost:3000", // Your frontend URL
//     credentials: true,
//   }

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

app.use(helmet());

// {
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["self"],
//         scriptSrc: ["'self'", "https://cdn.datatables.net", (req, res) => `'nonce-${res.locals.nonce}'`],
//         styleSrc: ["'self'", "https://cdn.datatables.net"],
//         connectSrc: ["'self'", "http://127.0.0.1:3000"],
//       },
//     },
//   }

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["duration", "ratingsQuantity", "ratingsAverage", "maxGroupSize", "difficulty", "price"],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use("/", viewRouter);
app.use("/api/v1/history", stockHistoryRouter);
app.use("/api/v1/transaction", stockTransactionRouter);
app.use("/api/v1/total", totalStockRouter);
app.use("/api/v1/bill", billRouter);
app.use("/api/v1/catalogue/", catRouter);
app.use("/api/v1/customer/", custRouter);
app.use("/api/v1/return/", returnRouter);
app.use("/api/v1/user", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
