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

// @route   PUT /api/entries/:id
// @desc    Update a journal entry
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const entry = await Entry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ msg: 'Entry not found' });
        }

        // Ensure user owns the entry
        if (entry.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { title, text } = req.body;
        entry.title = title || entry.title;
        entry.text = text || entry.text;

        await entry.save();
        res.json(entry);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/entries/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const entry = await Entry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ msg: 'Entry not found' });
        }

        // Ensure user owns the entry
        if (entry.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await entry.deleteOne();
        res.json({ msg: 'Entry removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;