const express = require("express");
const cors = require("cors");
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

    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
     const result = await cursor.toArray();
     res.send(result);
   });  

   

   app.delete('/users/:id', async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await usersCollection.deleteOne(query);
    res.send(result)
   })

   
 app.get("/items", async (req, res) => {
     const cursor = itemCollection.find();
    const result = await cursor.toArray();
    res.send(result);
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

   app.delete('/scholaritems/:id', async(req, res) =>{
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