const express = require("express")
const app = express()
const dotenv = require("dotenv")
const port = process.env.PORT || 5000
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs")
dotenv.config()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send("Hello assignment server")
})


const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // await client.connect();
        const database = client.db("DocAppoint");
        const doctorsCollection = database.collection("doctors");
        const appointsCollection = database.collection("appoints");

        const jwks = createRemoteJWKSet(
            new URL(`${process.env.JKS_PORT}/api/auth/jwks`)
        )

        const varifyToken = async (req, res, next) => {
            const authHeaders = req?.headers.authorization

            if (!authHeaders) {
                return res.status(401).json({
                    message: 'Unauthorize'
                })
            }

            const token = authHeaders.split(' ')[1]
            if (!token) {
                return res.status('401').json({
                    message: 'Unauthorizw'
                })
            }
            try {
                const { payload } = await jwtVerify(token, jwks)
                next()
            } catch (error) {
                return res.status(401).json({
                    message: 'Forbidden'
                })
            }
        }

        app.get('/doctors', async (req, res) => {

            try {
                const search = req.query.search || "";

                console.log("Hit", search);

                let query = {};

                if (search.trim() !== "") {
                    query = {
                        name: {
                            $regex: search,
                            $options: "i"
                        }
                    };
                }

                const result = await doctorsCollection.find(query).toArray();

                return res.status(200).send({
                    success: true,
                    message: "Fetch success",
                    data: result
                });

            } catch (error) {
                return res.status(500).send({
                    success: false,
                    message: "Failed to fetch doctors"
                });
            }
        });

        
        app.get('/top-rated', async (req, res) => {
            try {
                const result = await doctorsCollection
                    .find()
                    .sort({ rating: -1 })
                    .limit(3)
                    .toArray()

                res.status(500).send({
                    success: true,
                    message: "Fatch success",
                    data: result
                })
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: ('Error: Failed to fetch')

                })
            }

        })

        app.get('/doctors/:id', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await doctorsCollection.findOne({
                    _id: new ObjectId(id)
                });

                if (!result) {
                    return res.status(404).send({
                        success: false,
                        message: "Doctor not found"
                    });
                }

                res.status(200).send({
                    success: true,
                    message: "Details get success",
                    data: result
                });

            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: "Error: Details fetch failed",
                    error: error.message
                });
            }
        });

        app.post('/appoints', async (req, res) => {
            try {
                const appointData = req.body;

                // validation
                if (!appointData?.doctorName || !appointData?.userEmail) {
                    return res.status(400).json({
                        success: false,
                        message: "Required fields missing, may be you not loged in"
                    });
                }

                const exist = await appointsCollection.findOne({
                    doctorId: appointData.doctorId,
                    date: appointData.date,
                    time: appointData.time
                });

                if (exist) {
                    return res.status(409).json({
                        success: false,
                        message: "Appoint already exist. You may select same date and time"
                    });
                }
                const result = await appointsCollection.insertOne(appointData);

                return res.status(201).json({
                    success: true,
                    message: `${appointData.doctorName}'s appointment created successfully`,
                    data: result
                });

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: "Server error"
                });
            }
        });
        app.get('/appoints', async (req, res) => {
            try {
                const result = await appointsCollection.find().toArray()

                res.status(500).send({
                    success: true,
                    message: "Fatch success",
                    data: result
                })
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: ('Error: Failed to fetch')

                })
            }

        })

        app.get('/appoints/:userId', async (req, res) => {
            try {
                const { userId } = req.params
                const result = await appointsCollection.find({
                    userId: userId
                }).toArray()

                if (userId) {
                    res.status(500).send({
                        success: true,
                        message: 'Data get success',
                        data: result,

                    })
                }
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: "Error"
                })
            }


        })

        app.delete('/appoints/:userId/:id', async (req, res) => {
            try {
                const { userId, id } = req.params

                const result = await appointsCollection.deleteOne({
                    _id: new ObjectId(id),
                    userId: userId
                })
                res.status(500).send({
                    success: true,
                    message: "Delete success",
                    data: result
                })
            } catch (error) {
                res.status(5000).send({
                    success: false,
                    message: 'Error'
                })
            }

        })
        app.patch('/appoints/:userId/:id', async (req, res) => {
            try {
                const { userId, id } = req.params;
                const updateData = req.body;

                const filter = {
                    _id: new ObjectId(id),
                    userId: userId
                };

                const updateDoc = {
                    $set: updateData
                };

                const result = await appointsCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount === 0) {
                    return res.status(404).send({
                        success: false,
                        message: "No appointment updated"
                    });
                }

                res.status(200).send({
                    success: true,
                    message: "Appointment updated successfully",
                    data: result
                });

            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: "Update failed",
                    error: error.message
                });
            }
        });
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log("Port is running in ", port)
})