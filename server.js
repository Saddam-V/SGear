const mongoose = require("mongoose");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception 💥 Shutting Down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" }); // Load environment variables
const app = require("./app");

// Database connection
const DB =
  "mongodb://127.0.0.1:27017/SamsLocal?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0";
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection established"))
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });

// Serve React frontend
const frontendPath = path.join(__dirname, "../React/dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection 💥 Shutting Down...");
  console.log(err);
  server.close(() => process.exit(1));
});

// Close server when Electron exits
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
