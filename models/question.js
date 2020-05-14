var mongoose = require('mongoose');

var questionSchema = new mongoose.Schema({
    id: Number,
    user: String,
    heading: String,
    description: String,
    images: [String],
    keywords: [String],
    upvotes: Number,
    downvotes: Number
});

module.exports = mongoose.model('Question', questionSchema);