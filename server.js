const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" }); // Should always be before require app // This will read all env variables from the config file and set node js accordingly
const app = require("./app");

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    // console.log(con.connections);
    console.log("DB connection established");
  });

const port = process.env.PORT || 3000; // also using port from env variable
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
