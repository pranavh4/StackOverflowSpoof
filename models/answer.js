var mongoose = require('mongoose');

var answerSchema = new mongoose.Schema({
    questionID: Number,
    user: String,
    description: String,
    images: [String],
    upvotes: Number,
    downvotes: Number
});

module.exports = mongoose.model('Answer', answerSchema);