const mongoose = require("mongoose");
const Bill = require("./models/billModel"); // Adjust path as needed
const Cust = require("./models/custModel"); // Adjust path as needed

mongoose
  .connect(
    "mongodb://127.0.0.1:27017/SamsLocal?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0",
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    }
  )
  .then(() => {
    console.log("DB connection established");
  });

async function addCustomerIdToBills() {
  try {
    const bills = await Bill.find({}); // Fetch all bills

    for (let bill of bills) {
      // Find the customer document matching the bill's customer name and number
      let customer = await Cust.findOne({ custName: bill.custName, custNum: bill.custNum });

      if (!customer) {
        // Create a new customer if none is found
        customer = new Cust({
          custName: bill.custName,
          custNum: bill.custNum,
          // Add any other necessary fields here
        });
        await customer.save();
        console.log(`Created new customer for bill ${bill.billNum}`);
      }

      // Update the bill with the customerId
      bill.customerId = customer._id;
      await bill.save();
      console.log(`Updated bill ${bill.billNum} with customerId ${customer._id}`);
    }

    console.log("Data migration completed.");
  } catch (error) {
    console.error("Error during data migration:", error);
  } finally {
    mongoose.connection.close();
  }
}

addCustomerIdToBills();
