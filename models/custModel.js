const mongoose = require("mongoose");

const custSchema = new mongoose.Schema({
  custName: {
    type: String,
    required: [true, "must have a name"],
    // maxlength: [40, "A Catalogue name must have less or equal then 40 characters"],
    // minlength: [10, "A Catalogue name must have more or equal then 10 characters"],
    // validate: [validator.isAlpha, 'Tour name must only contain characters']
  },
  custNum: {
    type: String,
    // required: [true, "must have a number"],
  },
  orders: {
    type: Array,
    required: [true, "must have"],
  },
});

const Cust = mongoose.model("Cust", custSchema);

module.exports = Cust;
