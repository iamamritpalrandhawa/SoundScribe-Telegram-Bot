const mongoose = require("mongoose");
const mongoURL =
  "mongodb+srv://muicbot:music001@muicbot.rsmng8z.mongodb.net/SoundScribe?retryWrites=true&w=majority";

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log("Connection made successfully");
  } catch (error) {
    console.error("Connection error:", error);
  }
};

module.exports = connectToMongo;
