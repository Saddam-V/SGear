const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  custName: {
    type: String,
    required: [true, "must have a name"],
    trim: true,
  },
  custNum: {
    type: String,
  },
  billNum: {
    type: Number,
    required: [true, "must have a number"],
  },
  orders: {
    type: Array,
    required: [true, "must have"],
  },
  price: {
    type: Number,
    required: [true, "A tour must have a price"],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        return val <= this.price + this.priceDiscount;
      },
      message: "Discount price ({VALUE}) should be below regular price",
    },
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cust",
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  startDates: {
    type: String,
    required: [true, "A tour must have a date"],
  },
  discountUpdated: {
    type: Boolean,
    default: false,
  },
  billPaid: {
    type: Boolean,
    default: false,
  },
  amount_paid: {
    type: Number,
    default: 0, // Initial value is 0
  },
  amount_left: {
    type: Number,
    default: 0, // Initial value is 0
  },
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
