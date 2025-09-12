// backend/routes/entries.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Entry = require('../models/Entry');

// @route   POST /api/entries
// @desc    Create a new journal entry
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const newEntry = new Entry({
            user: req.user.id,
            text: req.body.text,
            title: req.body.title
        });

        const entry = await newEntry.save();
        res.json(entry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/entries
// @desc    Get all journal entries for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        console.log("Authenticated user ID:", req.user.id);
        const entries = await Entry.find({ user: req.user.id }).sort({ date: -1 });
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;