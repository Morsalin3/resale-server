const express = require('express');
const  cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ojgvcnk.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoryCollection = client.db("swap").collection("category");
        const usersCollection = client.db("swap").collection('users');

        app.get('/category', async(req, res)=>{
            const query = {};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        })
        // post users on database
        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });



    }
    finally{

    }
}
run().catch(console.log);



app.get('/', async(req, res)=>{
    res.send('resale server is running');
})

app.listen(port, ()=>{
    console.log(`resale running on port: ${port}`)
})