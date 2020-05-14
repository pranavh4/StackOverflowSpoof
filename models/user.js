var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    emailID: String,
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    profilePic: String
});

module.exports = mongoose.model('User', userSchema);