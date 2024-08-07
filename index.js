const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
var cors = require('cors')
const jwt = require('jsonwebtoken');

/* Midelware */

app.use(express.json())
app.use(cors())


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}



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
        const reviewCollection = client.db("FoodRestorent").collection("reviews");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })

        // Warning: use verifyJWT before using verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const query = { Email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })





        /* Food Get Api */
        app.get('/foods', async (req, res) => {
            const result = await foodCollection.find().toArray()
            res.send(result)
        })
        app.get('/food/:id', async (req, res) => {
            const foodId = req.params.id
            const query = { _id: new ObjectId(foodId) }
            const result = await foodCollection.findOne(query);
            // const result = await foodCollection.find().toArray()
            res.send(result)
        })
        app.post('/food', async (req, res) => {
            const food = req.body;
            const result = await foodCollection.insertOne(food);
            res.send(result)
        })

        app.delete('/food/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        })


        // Review  Method

        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        app.post('/review', async (req, res) => {
            const reviews = req.body;
            const result = await reviewCollection.insertOne(reviews);
            res.send(result)
        })

        /* Users Saved */

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })



        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { Email: user.Email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user exists ' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/user/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            // Specify the update to set a value for the plot field
            const updateDoc = {
                $set: {
                    role: "admin"
                },
            };
            // Update the first document that matches the filter
            const result = await usersCollection.updateOne(query, updateDoc, options);

            console.log(result);

            // const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })



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