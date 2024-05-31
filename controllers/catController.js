const APIFeatures = require("../utils/apiFeatures");
const Cat = require("../models/catModel");
var fs = require("fs");
const moment = require("moment");

// exports.createCat = async (req, res) => {
//   const data = req.body.orders;

//   for (let index = 0; index < data.length; index++) {
//     data[index] = JSON.parse(data[index]);
//   }

//   try {
//     const doc = await Cat.findOne({ catNum: data[data.length - 1].catNum });

//     const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");

//     if (doc == null) {
//       myobj = {
//         catName: data[data.length - 1].catName,
//         catNum: data[data.length - 1].catNum,
//         orders: data,
//         startDates: currentDateTime,
//       };

//       await Cat.create(myobj);
//       res.status(200).json({
//         status: "success",
//       });
//     } else {
//       throw "Already exists";
//     }
//     // =================================================================
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };
exports.createCat = async (req, res) => {
  const data = req.body.orders;

  for (let index = 0; index < data.length; index++) {
    data[index] = JSON.parse(data[index]);
  }

  try {
    const doc = await Cat.findOne({ catNum: data[data.length - 1].catNum });

    const currentDateTime = moment().format("YYYY-MM-DD-HH:mm:ss");

    if (doc == null) {
      myobj = {
        catName: data[data.length - 1].catName,
        catNum: data[data.length - 1].catNum,
        orders: data,
        startDates: currentDateTime,
      };

      await Cat.create(myobj);
      res.status(200).json({
        status: "success",
      });
    } else {
      throw "Already exists";
    }
    // =================================================================
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

// Function to Update rate
exports.updateCatOrders = async (req, res) => {
  const { catNum, colNum, updatedRate } = req.body;
  console.log(colNum);
  try {
    // Find the Cat document based on catNum
    const catToUpdate = await Cat.findOne({ catNum });

    console.log(catToUpdate);
    if (catToUpdate) {
      // Update rate for all orders if colNum is not provided
      if (!colNum) {
        catToUpdate.orders.forEach((order) => (order.rate = updatedRate));
      } else {
        // Update rate for specific colNum if provided
        const orderIndex = catToUpdate.orders.findIndex((order) => order.colNum === colNum);
        if (orderIndex !== -1) {
          catToUpdate.orders[orderIndex].rate = updatedRate;
        } else {
          throw "Column number not found for this catNum";
        }
      }

      // Stringify orders array and the whole object before saving
      catToUpdate.orders = catToUpdate.orders;
      const catToUpdateStringified = JSON.stringify(catToUpdate);

      // Save the updated document
      const savedCat = await Cat.findByIdAndUpdate(catToUpdate._id, JSON.parse(catToUpdateStringified), { new: true });

      console.log(savedCat);

      res.status(200).json({
        status: "success",
        data: savedCat, // Send back the updated cat document
      });
    } else {
      throw "Cat not found";
    }
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

// Function to Update rate
// exports.updateCatOrders = async (req, res) => {
//   const { catNum, colNum, updatedRate } = req.body;

//   try {
//     // Find the Cat document based on catNum
//     const catToUpdate = await Cat.findOne({ catNum });

//     console.log(catToUpdate);
//     if (catToUpdate) {
//       // Find the index of the order within the orders array
//       const orderIndex = catToUpdate.orders.findIndex((order) => order.colNum === colNum);
//       console.log(orderIndex);
//       if (orderIndex !== -1) {
//         // Update the rate of the specified colNum
//         catToUpdate.orders[orderIndex].rate = updatedRate;

//         // Stringify orders array and the whole object before saving
//         catToUpdate.orders = catToUpdate.orders;
//         const catToUpdateStringified = JSON.stringify(catToUpdate);

//         // Save the updated document
//         const savedCat = await Cat.findByIdAndUpdate(catToUpdate._id, JSON.parse(catToUpdateStringified), { new: true });

//         console.log(savedCat);

//         res.status(200).json({
//           status: "success",
//           data: savedCat, // Send back the updated cat document
//         });
//       } else {
//         throw "Column number not found for this catNum";
//       }
//     } else {
//       throw "Cat not found";
//     }
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

// exports.createCat = async (req, res) => {
//   const data = req.body.orders;
//   console.log("this is data");
//   console.log(data);
//   var str = fs.readFileSync(`${__dirname}/../dev-data/catNo.txt`, "utf8"); // This will block the event loop, not recommended for non-cli programs.
//   console.log("result read: " + str);
//   try {
//     for (let index = 0; index < data.length; index++) {
//       await totalStockController.catCreated(data[index], res);
//     }
//     let prc = 0;
//     for (let index = 0; index < data.length; index++) {
//       data[index] = JSON.parse(data[index]);
//       prc = prc + parseFloat(data[index].meter) * parseFloat(data[index].rate);
//       console.log("here");
//       console.log(prc);
//     }
//     // const lastObj = JSON.parse(data[data.length - 1])
//     prc = prc - data[data.length - 1].priceDiscount;
//     // const priceIncluded = { ...req, price: prc.toString() };
//     console.log(prc);
//     console.log("see this");
//     myobj = {
//       custName: data[data.length - 1].custName,
//       custNum: data[data.length - 1].custNum,
//       orders: data,
//       price: prc.toString(),
//       priceDiscount: data[data.length - 1].priceDiscount,
//     };

//     await Cat.create(myobj);

//     // newstr = parseInt(str) += 1;
//     // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, newstr);
//     // res.statusMessage = str.toString();
//     res.status(200).end();
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

exports.getAllCat = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(Cat.find(), req.query).filter().sort().limitFields().paginate();
    const cats = await features.query;

    res.status(200).json({
      status: "success",
      results: cats.length,
      data: {
        cats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getCat = async (req, res) => {
  try {
    const cat = await Cat.findById(req.params.id);
    // Cat.findOne({ _id: req.params.id })

    res.status(200).json({
      status: "success",
      data: {
        cat,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateCat = async (req, res) => {
  try {
    const cat = await Cat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        cat,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteCat = async (req, res) => {
  try {
    await Cat.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getCatSearch = async (req, res) => {
  try {
    const cat = req.params.cat;

    const cats = await Cat.aggregate([
      {
        $match: { $or: [{ catName: cat }, { catNum: cat }, { startDates: cat }] },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        cats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
