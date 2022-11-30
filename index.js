const express = require('express');
const  cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ojgvcnk.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const categoryCollection = client.db("swap").collection("category");
        const usersCollection = client.db("swap").collection('users');
        const productsCollection = client.db("swap").collection('products');


        const verifyAdmin = async (req, res, next)=>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }
        const verifyBuyer = async (req, res, next)=>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user?.role !== 'buyer'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }
        const verifySeller = async (req, res, next)=>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user?.role !== 'seller'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }
        // jwt token
        app.get('/jwt', async(req, res)=>{
            const email = req.query.email;
            // console.log(email)
            const query = {email: email}
            const user = await usersCollection.findOne(query)
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
                return res.send({accessToken: token})
            }
            // console.log(user);
            res.status(403).send({accessToken: ''})
        });

        app.get('/category', async(req, res)=>{
            const query = {};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        });
        // post products
        app.post('/products',verifyJWT, verifySeller, async(req, res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });
          //get products
          app.get('/products',verifyJWT,verifySeller, async(req, res)=>{
            const email =req.query.email;
            // const decodedEmail = req.decoded.email;

            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = {email: email}
            const result = await productsCollection.find(query).toArray();
            res.send(result);
          })


        // post users on database
        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });

         //get sellers
         app.get('/users/sellers', async(req, res)=>{
            const query = {role: "seller"}; 
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
         //get buyers
         app.get('/users/buyers', async(req, res)=>{
            const query = {role: "buyer"}; 
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // delete users
        app.delete('/users/:id', verifyJWT, verifyAdmin, async(req, res)=>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        // get isadmin
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            // console.log('admin',user);
            res.send({isAdmin: user?.role === 'admin'});
        });
        // get isSeller
        app.get('/users/seller/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            // console.log('seller', user)
            res.send({isSeller: user?.role === 'seller'});
        });
        // get isBuyer
        app.get('/users/buyer/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            // console.log('buyer', user)
            res.send({isBuyer: user?.role === 'buyer'});
        });

        // post product
        // app.post('/products', async(req, res)=>{
        //     const product = req.body;
        //     const result = await productsCollection.insertOne(product);
        //     res.send(result)
        // })



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