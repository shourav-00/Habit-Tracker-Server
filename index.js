const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri =
  "mongodb+srv://Habit-Tracker:yX1CDCntEh1l4IIc@cluster0.btpwoe8.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    const addHabitDB = client.db("Add-Habit");
    const AddedHabitCOLL = addHabitDB.collection("User-Habits");
    const publicHabitsCOLL = addHabitDB.collection("Public-Habits");


    app.post("/addHabits", async (req, res) => {
      const newHabit = {
        ...req.body,
        completionHistory: [],
        createdAt: new Date(),
      };
      const result = await AddedHabitCOLL.insertOne(newHabit);
      res.send(result);
    });

 
    app.get("/UserData", async (req, res) => {
      const result = await AddedHabitCOLL.find().sort({ createdAt: -1 }).toArray();
      res.send(result);
    });


    app.get("/publicHabits", async (req, res) => {
      const result = await publicHabitsCOLL.find().toArray();
      res.send(result);
    });


    app.get("/publicHabitsLimit", async (req, res) => {
      const result = await publicHabitsCOLL.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.send(result);
    });

   
    
    app.get("/UserData/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await publicHabitsCOLL.findOne({ _id: new ObjectId(id) });
        if (!result) return res.status(404).send({ message: "Habit not found" });
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    app.delete("/User/:id", async (req, res) => {
      const id = req.params.id;
      const result = await AddedHabitCOLL.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update user habit by ID
    app.patch("/UserData/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        const result = await AddedHabitCOLL.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

const { ObjectId } = require("mongodb");

app.get("/habit/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const habit = await AddedHabitCOLL.findOne({ _id: id }); 
    if (!habit) return res.status(404).send({ message: "Habit not found" });
    res.send(habit);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


        
    // Mark habit as complete (add today to completionHistory)
    app.patch("/UserData/:id/complete", async (req, res) => {
      const id = req.params.id;
      const today = new Date().toDateString();

      try {
        const result = await AddedHabitCOLL.updateOne(
          { _id: new ObjectId(id) },
          { $addToSet: { completionHistory: today } } // adds today if not exists
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Habit not found" });
        }

        if (result.modifiedCount === 0) {
          return res.status(400).send({ message: "Already completed today!" });
        }

        // Return updated habit
        const updatedHabit = await AddedHabitCOLL.findOne({ _id: new ObjectId(id) });
        res.send({ completionHistory: updatedHabit.completionHistory });
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } finally {
    console.log("Server setup finished");
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
