// the activities structure

const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', //a reference to a document in the User collection 
        required: true
    },
    activityName: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        default: 0
    },
    quality: {
        type: Number,
        min: 1,
        max: 5
    },
    details: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);