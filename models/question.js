var mongoose = require('mongoose');

var questionSchema = new mongoose.Schema({
    user: String,
    heading: String,
    description: String,
    images: [String],
    keywords: [String],
    upvotes: [String],
    downvotes: [String]
});

module.exports = mongoose.model('Question', questionSchema);