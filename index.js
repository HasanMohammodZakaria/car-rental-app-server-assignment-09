const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

dotenv.config();

const app = express();
const port = process.env.PORT || 8008;



app.use(cors({
    origin: process.env.CLIENT_URL,
    credential: true,
}));
app.use(express.json());




const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const jwks = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    try {
        const { payload } = await jwtVerify(token, jwks)
        //console.log(payload);
        next()
    } catch (error) {
        return res.status(403).json({
            message: "Forbidden"
        });

    }


}


async function run() {
    try {

        // await client.connect();


        const db = client.db('car-rental');

        const carsCollection = db.collection('cars');
        const bookingCollection = db.collection('bookingsData')

        app.get('/cars/types', async (req, res) => {
            try {
                const result = await carsCollection.aggregate([
                    {
                        $group: {
                            _id: "$carType"
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            carType: '$_id'
                        }
                    },
                    {
                        $sort: {
                            carType: 1
                        }
                    }
                ]).toArray();
                const types = result.map(item => item.carType)
                res.json(types);
            } catch (error) {
                console.error("ERROR /cars/types:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })


        app.get('/cars', async (req, res) => {

            try {
                const { search, type } = req.query;
                const query = {};
                if (search) {
                    query.carName = { $regex: search, $options: "i" };
                }

                if (type) {
                    query.carType = type;
                }
                const cursor = carsCollection.find(query);
                const result = await cursor.toArray();
                res.json(result);

            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        });


        app.get('/available-cars', async (req, res) => {
            try {
                const cursor = carsCollection.find().limit(6)
                const result = await cursor.toArray()
                res.json(result)
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })

        app.get('/cars/:carId', verifyToken, async (req, res) => {

            try {
                const { carId } = req.params;
                const query = { _id: new ObjectId(carId) }
                const result = await carsCollection.findOne(query)
                res.json(result);
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })

        app.get('/my-added-cars/:userId', verifyToken, async (req, res) => {
            try {
                const { userId } = req.params;
                const result = await carsCollection.find({ addedBy: userId }).toArray();
                res.json(result);
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })

        app.post("/cars", verifyToken, async (req, res) => {
            try {
                const carData = req.body;
                const result = await carsCollection.insertOne(carData);
                res.json(result)

            } catch (error) {
                res.status(500).json({ message: "Server Error" });
            }
        })

        app.get('/booking/:bookedById', verifyToken, async (req, res) => {
            try {
                const { bookedById } = req.params
                const result = await bookingCollection.find({ bookedById }).toArray()
                res.json(result)
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }

        })


        app.post('/booking', verifyToken, async (req, res) => {
            try {
                const bookingData = req.body
                const { carId, ...rest } = bookingData
                const result = await bookingCollection.insertOne({ carId, ...rest })

                const updateResult = await carsCollection.updateOne(
                    { _id: new ObjectId(carId) },
                    { $inc: { bookedCount: 1 } }

                )

                console.log('updateResult:', updateResult);
                res.json(result)
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })

        app.patch('/cars/:id', verifyToken, async (req, res) => {
            try {
                const { id } = req.params
                const updatedCar = req.body
                const result = await carsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedCar }

                )
                res.json(result)
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })

        app.delete('/booking/:id', verifyToken, async (req, res) => {
            try {
                const { id } = req.params;
                const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) })
                res.json(result);
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })

        app.delete('/cars/:id', verifyToken, async (req, res) => {
            try {
                const { id } = req.params
                const result = await carsCollection.deleteOne({ _id: new ObjectId(id) })
                res.json(result);
            } catch (error) {
                console.error("REAL ERROR:", error);
                res.status(500).json({ message: "Server Error" })
            }
        })



        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Server is running fine!');
})

// server

app.listen(port, () => {
    console.log(`Example express js running on port ${port}`);
});


