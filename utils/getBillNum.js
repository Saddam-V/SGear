// utils/getBillNum.js
const Counter = require("../models/Counter");

const getBillNum = async () => {
  const result = await Counter.findOneAndUpdate(
    { name: "billNum" }, // Query: look for the billNum counter
    { $inc: { seq: 1 } }, // Update: increment the seq field by 1
    { new: true, upsert: true } // Options: return the updated document, create if not found
  );

  return result.seq;
};

module.exports = getBillNum;
