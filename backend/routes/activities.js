
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// @route   POST /api/activities
// @desc    Create a new activity log
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { activityName, duration, quality, details } = req.body;

        const newActivity = new Activity({
            user: req.user.id,
            activityName,
            duration,
            quality,
            details,
        });

        const activity = await newActivity.save();
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/activities
// @desc    Get all activity logs for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ user: req.user.id }).sort({ date: -1 });
        res.json(activities);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/activities/:id
// @desc    Update an activity log
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({ msg: 'Activity not found' });
        }

        // Ensure user owns the activity
        if (activity.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { activityName, duration, quality, details } = req.body;
        activity.activityName = activityName || activity.activityName;
        activity.duration = duration || activity.duration;
        activity.quality = quality || activity.quality;
        activity.details = details || activity.details;

        await activity.save();
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity log
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({ msg: 'Activity not found' });
        }

        // Ensure user owns the activity
        if (activity.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await activity.deleteOne();
        res.json({ msg: 'Activity removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;