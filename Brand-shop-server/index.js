const express = require('express');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config({Bucket: true})
const port = process.env.PORT  || 5000 ;

app.use(cors({
 origin: ['http://localhost:5173'],
 credentials: true,
 optionsSuccessStatus:200
}))
app.use(express.json())
app.use(cookieParser())

// madelware here

const logger = async(req,res,next) =>{
  const url = req.url;
  const method = req.method;
  console.log(url,method);
  next()
}
const verifyToken = async (req,res,next)=>{
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({message: 'unauthorized access'})
  }
  
  console.log('token in the meddleware',token);
  jwt.verify(token,process.env.secrect_key,(err,decoded)=>{
    if (err) {
      return res.status(401).send({message:'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
}

console.log(process.env.collection_user);

const uri = `mongodb+srv://${process.env.collection_user}:${process.env.collection_pass}@cluster0.raemxbz.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    const database = client.db("[productDB");
    const productCollection = database.collection("products");
    const cardCollection = database.collection("cardinfo");
  
  // crate api for atuntication 

  app.post('/jwtstion',async(req,res)=>{
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user,process.env.secrect_key,{expiresIn:'1h'})
    console.log(token);
    res.cookie('token',token,{
      httpOnly:true,
      secure:true,
      sameSite:'none'
    }).send({tokenStatus: 'success'});
  })

  app.post('/logout',async(req,res)=>{
    const user = req.body;
    console.log(user,'logout');
    res.clearCookie('token').send({status:'success'})
  })
    
// create api for production 
    app.post('/product',async(req,res)=>{
          const productInfo =   req.body;
          console.log(productInfo);
          const result = await productCollection.insertOne(productInfo)
          res.send(result)
    })
    app.get('/product/:brandname',async(req,res)=>{
        const brandnam = req.params.brandname;
        console.log(brandnam);
        const cursor = productCollection.find({ brandname: brandnam })
        const result = await cursor.toArray()
        res.send(result)
    })
    app.get('/productviwe/:id',logger,verifyToken,async(req,res)=>{
      const proeductid = req.params.id;
      console.log(req.query.email);
      console.log(req.user.email);
      if (req.user.email === req.query.email) {
        return res.status(403).send({message:'forbideen access'})
      }
      const query = {_id: new ObjectId(proeductid)}
      const result = await productCollection.findOne(query)
      res.send(result);
    })
    app.post('/productadd',async(req,res)=>{
      const cardinfo = req.body;
      const result = await cardCollection.insertOne(cardinfo)
      res.send(result)
    })
    app.get('/cardinfo',async(req,res)=>{
      const coursor = cardCollection.find()
      const result = await coursor.toArray()
      res.send(result)
    })
    app.delete('/cardDelete/:id',async(req,res)=>{
      const cardid = req.params.id;
      console.log(cardid);
      const query = {_id:new ObjectId(cardid)}
      const result = await cardCollection.deleteOne(query)
      res.send(result)
    })
   
    app.get('/update/:id',async(req,res)=>{
      const productid = req.params.id;
      const query = {_id: new ObjectId(productid)}
      const result = await productCollection.findOne(query)
      res.send(result)
    })
    app.put('/update/:id',async(req,res)=>{
      const productid = req.params.id;
      const productinfo = req.body;
      const filter ={_id: new ObjectId(productid)}
      const options = {upsert: true}
      const updateProduct ={
        $set:{
           img : productinfo.img,
           name : productinfo.name,
           brand : productinfo.brand,
           price : productinfo.price,
           short_description : productinfo.description,
           rating : productinfo.rating,
           type : productinfo.type
        }
      }
      const result = await productCollection.updateOne(filter,updateProduct,options)
      res.send(result)
    })
    const database1 = client.db("bannerDB");
    const bannerCollection = database1.collection("banner");
    app.get('/banner/:brandname',async(req,res)=>{
      const brandName = req.params.brandname;
      const coursor = bannerCollection.find({brand_name : brandName})
      const result = await coursor.toArray()
      res.send(result)
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



app.get('/',(req, res)=>{
    res.send('server running ')
})
app.listen(port,()=>{
    console.log(`server running from the ${port}`);
})


const database = client.db('brandDB')
const brandCollection = database.collection('brand')
const brandDetailsCollection = database.collection('brandDetails')
const cartCollection = database.collection("cart");

app.delete("/myCart/:id", async (req, res) => {
   
    const id = req.params.id
    
    const query ={_id : new ObjectId(id)}
    const result = await cartCollection.deleteOne(query);
    res.send(result)
  });