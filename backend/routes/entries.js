const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/entries
// @desc    Get all user's journal entries
// @access  Private
router.get('/', auth, (req, res) => {
    try {
        // We can access the user's ID from req.user because the 'auth' middleware has already validated the token
        console.log("Authenticated user ID:", req.user.id);
        res.json({ msg: "This is a protected route! Access granted." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;