const express = require("express");
const cors = require("cors");
var jwt = require('jsonwebtoken');
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wdiwjgo.mongodb.net`;

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());  



app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://book-haven-six.vercel.app",
      "book-haven-bba9e.firebaseapp.com",
    ],
    credentials: true,
  })
);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
async function run() {
  try {
    await client.connect();
    const itemCollection = client.db("ScholarShip").collection("AllScholarShip");
    const scholarCollection = client.db("ScholarShip").collection("scholarfromuser");
    const usersCollection = client.db("ScholarShip").collection("users");
   
    // jwt realted api 
    app.post('/jwt', async(req, res)=>{
      
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.send({token})
    })

    // verifytokenmiddleaweres 
const verifyToken = (req, res, next)=>{
  
  if(!req.headers.authorization){
    return res.status(401).send({message:'UnAuthorized Access'})
  }
  const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(401).send({message:'UnAuthorized Access'})
    }
    req.decoded = decoded
    next()
  });


  // next()
}

// verify admin 

const verifyAdmin = async (req, res, next) =>{
  const email = req.decoded.email
  const query = {email : email}
  const user = await usersCollection.findOne(query)
  const isAdmin = user?.role === 'admin'
  if(!isAdmin){
    return res.status(403).send({message : 'Forbidden Access'})
  }
  next()
}
    

    app.post("/users",  async (req, res) => {
      const user = req.body;
      const query =  {email : user.email}
      const existingUser = await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message: 'user Already Exist', insertedId: null})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", verifyToken, verifyAdmin,  async (req, res) => {
      
      const cursor = usersCollection.find();
     const result = await cursor.toArray();
     res.send(result);
   });  

   app.get('/users/admin/:email', verifyToken, async(req,res) =>{
      const email = req.params.email
      if(email !== req.decoded.email){
        res.status(403).send({message : 'Forbidden Access'})
      }
      const query = {  email: email}
      const user = await usersCollection.findOne(query)
      let admin = false
      let moderator = false
      if (user) {
        if (user.role === 'admin') {
          admin = true;
        } else if (user.role === 'moderator') {
          moderator = true;
        }
      }
      res.send({admin, moderator})
   })

   

   app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await usersCollection.deleteOne(query);
    res.send(result)
   })
   app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const updateDoc = {
      $set: {
        role: `moderator`
      },
    };
    const result = await usersCollection.updateOne(query, updateDoc);
    res.send(result)
   })

   
 app.get("/items", async (req, res) => {
     const cursor = itemCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  app.delete('/items/:id', async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await itemCollection.deleteOne(query);
    res.send(result)
   })

  app.post("/items",  async (req, res) => {
    const newItem = req.body;
    const result = await itemCollection.insertOne(newItem);
    res.send(result);
  });
  
  app.get("/items/update/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await itemCollection.findOne(query);
    res.send(result);
  });
  
  app.put("/updateItem/:id", async (req, res) => {
    const id = req.params.id;
    const item = req.body;
    const query = { _id: new ObjectId(id) };
    const data = {
      $set: {
        scholarshipName : item.scholarshipName,
        university_name: item.university_name,
        university_image: item.university_image,
        universityCountry: item.universityCountry,
        universityCity: item.universityCity,
        universityWorldRank: item.universityWorldRank,
        subjectCategory: item.subjectCategory,
        scholarshipCategory: item.scholarshipCategory,
        degree: item.degree,
        tuitionFees: item.tuitionFees,
        applicationFees: item.applicationFees,
        serviceCharge: item.serviceCharge,
        applicationDeadline: item.applicationDeadline,
        scholarshipPostDate: item.scholarshipPostDate,
        postedUserEmail: item.postedUserEmail
      },
    };
    try {
        const result = await itemCollection.updateOne(query, data);
        res.send(result);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).send({ message: 'Failed to update item' });
    }
});


    app.get("/singleItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection.findOne(query);
      res.send(result);
    });

    app.post("/scholarfromuser",  async (req, res) => {
      const newItem = req.body;
      const result = await scholarCollection.insertOne(newItem);
      res.send(result);
    });

    app.get("/scholaritems", async (req, res) => {
      const email = req.query.email
      const query = {user_email : email}
      const cursor = scholarCollection.find(query);
     const result = await cursor.toArray();
     res.send(result);
   });  
    app.get("/allscholaritems", async (req, res) => {
      const cursor = scholarCollection.find();
      const result = await cursor.toArray();
      res.send(result);
   });  

   app.delete('/scholaritems/:id', async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await scholarCollection.deleteOne(query);
    res.send(result)
   })
   
   app.delete('/allscholaritems/:id', async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await scholarCollection.deleteOne(query);
    res.send(result)
   })




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Start Server ");
});

app.listen(port, () => {
  console.log(`Server is Runnig ${port}`);
});