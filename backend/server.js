const entries = require('./routes/entries');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); //added later to allow the flow of requests between localhost5000(backend) and localhost3000 (frontend)

// Initialize the Express app
const app = express();
const PORT = 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lifelogix')
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

// Middleware to parse JSON

app.use(express.json());
app.use(cors());

// Use the authentication routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', entries); //already required before
app.use('/api/activities', require('./routes/activities'));
// Basic test route
app.get('/', (req, res) => {
    res.send('Welcome to the LifeLogix Backend!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});