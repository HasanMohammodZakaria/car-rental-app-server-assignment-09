const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// middleware
app.use(cors());
app.use(express.json());


// routes
app.get('/', (req, res) => {
    res.send("Hello Car Rental App");
})


// server
app.listen(port, () => {
    console.log(`Example express js running on port ${port}`);
});