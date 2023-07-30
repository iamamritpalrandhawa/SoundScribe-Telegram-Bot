const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    User_ID: { type: Number, required: true, unique: true },
    First_Name: { type: String, required: true },
    Last_Name: { type: String },
    Username: { type: String },
    Chat_ID: { type: Number, required: true },
    Registration_Date: { type: Date, default: Date.now },
});
// Create models based on the schemas
const User = mongoose.model('User', userSchema);



// Export the models
module.exports = User;

