const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
var cors = require('cors')

/* Midelware */

app.use(express.json())
app.use(cors())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iyhhy.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        /* Database Collections */
        const foodCollection = client.db("FoodRestorent").collection("foods");
        const usersCollection = client.db("FoodRestorent").collection("users");
        const cartCollection = client.db("FoodRestorent").collection("carts");

        /* Food Get Api */
        app.get('/foods', async (req, res) => {
            const result = await foodCollection.find().toArray()
            res.send(result)
        })

        /* Users Saved */
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user exists ' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });



        // cart collection apis
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/carts', async (req, res) => {
            const item = req.body;
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Food Restorent Server Runing')
})



app.listen(port, () => {
    console.log(`Food Restorent app listening on port ${port}`)
})