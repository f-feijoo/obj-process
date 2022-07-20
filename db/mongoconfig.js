const mongoose = require("mongoose");
require('dotenv').config()

mongoose.connect(`mongodb://anyone:${process.env.MONGOPASS}@proyecto-final-shard-00-00.obuuu.mongodb.net:27017,proyecto-final-shard-00-01.obuuu.mongodb.net:27017,proyecto-final-shard-00-02.obuuu.mongodb.net:27017/?ssl=true&replicaSet=atlas-xzhi9f-shard-0&authSource=admin&retryWrites=true&w=majority`);

mongoose.connection.on("open", () => {
  console.log("Database ok!");
});

mongoose.connection.on("error", () => {
  console.log("Database error");
});
