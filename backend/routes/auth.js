// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const jwtSecret = 'my_jwt_secret_token'; 

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        //get data:
        const { username, password } = req.body;
        //check for existing user:
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ username, password });
        //hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { user: { id: user.id } };
        //create the JWT
        jwt.sign(payload, jwtSecret, { expiresIn: '10h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        //check if the user exists
        let user = await User.findOne({username});
        if (!user) {
            return res.status(400).json({msg: 'Invalid Credentials'});
        }
        //compare the plain text password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({msg: 'Invalid Credentials'});
        }
        //create and send a JWT
        const payload = {user: {id: user.id}};
        jwt.sign(payload, jwtSecret, { expiresIn: '10h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
    }
});

module.exports = router;