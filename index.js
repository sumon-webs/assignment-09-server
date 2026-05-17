const express = require("express")
const app = express()
const dotenv = require("dotenv")
const port = process.env.PORT || 5000
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        app.get('/doctors', async (req, res) => {
            try {
                const result = await doctorsCollection.find().toArray()

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