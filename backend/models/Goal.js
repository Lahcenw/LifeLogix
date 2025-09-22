//This is the structure of the goals entries in the database
const mongoose = require('mongoose');

// 1. Define the subGoalSchema first
const subGoalSchema = new mongoose.Schema({
    subGoalName: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        default: 0
    },
    targetDuration: {
        type: Number
    },
    activityType: {
        type: String
    }
});

// 2. Then, define the main GoalSchema
const GoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // links an entry to the user who created it
    },
    goalName: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    targetDate: {
        type: Date,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    subGoals: [subGoalSchema],
});
//Progress bar
GoalSchema.virtual('overallProgress').get(function() {
    if (!this.subGoals || this.subGoals.length === 0) {
        return 0;
    }

    const totalSubGoals = this.subGoals.length;
    const completedSubGoals = this.subGoals.filter(sub => sub.progress === 100).length;

    return Math.round((completedSubGoals / totalSubGoals) * 100);
});

GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });
module.exports = mongoose.model('Goal', GoalSchema);