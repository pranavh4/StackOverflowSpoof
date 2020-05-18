var mongoose = require('mongoose');

var answerSchema = new mongoose.Schema({
    questionID: String,
    user: String,
    description: String,
    images: [String],
    upvotes: [String],
    downvotes: [String]
});

module.exports = mongoose.model('Answer', answerSchema);