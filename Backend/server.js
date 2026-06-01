 const userRoute =require("./Routes/userRoute");
const express = require('express');
const server = express();

const connectDB =require("./Config/DB").connectDB;
require("dotenv").config();

connectDB();
server.use("/",userRoute);
async function startServer() {
  await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
};
startServer();
