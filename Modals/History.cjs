const mongoose = require('mongoose');

// Define the Download_History schema
const downloadHistorySchema = new mongoose.Schema({
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
    Download_Date: { type: Date, default: Date.now },
});

const Download_History = mongoose.model('Download_History', downloadHistorySchema);

module.exports = Download_History;