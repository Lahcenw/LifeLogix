// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    //Automatically recoding the date and time when a user is created
    date: {
        type: Date,
        default: Date.now,
    },
});

const user = mongoose.model('user', UserSchema);

module.exports = user;