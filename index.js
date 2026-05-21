const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 8008;


// middleware
app.use(cors());
app.use(express.json());


// routes

const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        //await client.db("admin").command({ ping: 1 });

        const db = client.db('car-rental');

        const carsCollection = db.collection('cars');
        const bookingCollection = db.collection('bookingsData')

        app.get('/', (req, res) => {
            res.send('Car Rental Running')
        })

        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find();
            const result = await cursor.toArray();
            //console.log(result);
            res.json(result);
        });

        app.get('/available-cars', async (req, res) => {
            const cursor = carsCollection.find().limit(6)
            const result = await cursor.toArray()
            res.json(result)
        })

        app.get('/cars/:carId', async (req, res) => {
            const { carId } = req.params;
            //console.log(carId);
            const query = { _id: new ObjectId(carId) }
            const result = await carsCollection.findOne(query)
            res.json(result);
        })

        app.post('/cars', async (req, res) => {
            const carData = req.body
            console.log(carData);
            const result = await carsCollection.insertOne(carData)
            res.json(result)
        })

        app.get('/booking/:bookedById', async (req, res) => {
            const { bookedById } = req.params
            const result = await bookingCollection.find({ bookedById }).toArray()
            res.json(result)

        })

        app.post('/booking', async (req, res) => {
            const bookingData = req.body
            const result = await bookingCollection.insertOne(bookingData)
            res.json(result)
        })




        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// server

app.listen(port, () => {
    console.log(`Example express js running on port ${port}`);
});


