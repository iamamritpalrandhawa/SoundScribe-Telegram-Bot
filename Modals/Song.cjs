const mongoose = require('mongoose');

// Define the Song schema
const songSchema = new mongoose.Schema({
    Title: { type: String, required: true },
    YouTube_ID: { type: String, required: true, unique: true },
    File_ID: { type: String }, // Add the File_ID field
});
const Song = mongoose.model('Song', songSchema);
module.exports = Song;