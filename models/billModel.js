const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  custName: {
    type: String,
    required: [true, "must have a name"],
    trim: true,
    // maxlength: [40, "A Catalogue name must have less or equal then 40 characters"],
    // minlength: [10, "A Catalogue name must have more or equal then 10 characters"],
    // validate: [validator.isAlpha, 'Tour name must only contain characters']
  },
  custNum: {
    type: String,
    // required: [true, "must have a number"],
  },
  billNum: {
    type: Number,
    required: [true, "must have a number"],
  },
  orders: {
    type: Array,
    required: [true, "must have"],
  },
  // catNum: {
  //   type: Number,
  //   required: [true, "A Catalogue must have a name"],
  //   trim: true,
  //   // maxlength: [40, "A Catalogue name must have less or equal then 40 characters"],
  //   // minlength: [10, "A Catalogue name must have more or equal then 10 characters"],
  //   // validate: [validator.isAlpha, 'Tour name must only contain characters']
  // },
  // colNum: {
  //   type: String,
  //   required: [true, "must have a number"],
  // },
  // //   rate: {
  // //     type: Number,
  // //     required: [true, "must have a number"],
  // //   },
  // meter: {
  //   type: Number,
  //   required: [true, "must have a meter"],
  // },
  price: {
    type: Number,
    required: [true, "A tour must have a price"],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        // this only points to current doc on NEW document creation
        return val <= this.price + this.priceDiscount;
      },
      message: "Discount price ({VALUE}) should be below regular price",
    },
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Cust", required: true }, // Reference to the customer
  createdAt: {
    type: Date,
    default: new Date(),
  },
  startDates: {
    type: String,
    required: [true, "A tour must have a date"],
  },
  discountUpdated: {
    type: Boolean, // Or a different data type if needed
    default: false, // Initial value is false (discount not applied)
  },
  billPaid: {
    type: Boolean, // Or a different data type if needed
    default: false, // Initial value is false (Bill not paid)
  },
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
