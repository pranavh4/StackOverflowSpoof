var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    profilePic: String
});

module.exports = mongoose.model('User', userSchema);