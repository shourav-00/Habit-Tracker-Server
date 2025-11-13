const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri =
  // "mongodb+srv://Habit-Tracker:yX1CDCntEh1l4IIc@cluster0.btpwoe8.mongodb.net/?appName=Cluster0";
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.btpwoe8.mongodb.net/?appName=Cluster0`;

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
      const result = await AddedHabitCOLL.find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/publicHabits", async (req, res) => {
      const result = await publicHabitsCOLL.find().toArray();
      res.send(result);
    });

    app.get("/publicHabitsLimit", async (req, res) => {
      const result = await publicHabitsCOLL
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/habitDetails/:id", async (req, res) => {
      const habitId = req.params.id; // this is a string
      try {
        const habit = await publicHabitsCOLL.findOne({ _id: habitId }); // use string directly
        if (!habit) return res.status(404).json({ message: "Habit not found" });
        res.json(habit);
      } catch (error) {
        res.status(500).json({ message: "Server Error", error });
      }
    });

    // Mark habit as complete for today (string _id) using $push
    // Mark habit as complete for today (string _id) safely
    // Mark public habit as complete (string _id)
    app.patch("/User/:id/complete", async (req, res) => {
      const { id } = req.params;
      const todayStr = new Date().toDateString();

      try {
        // Find habit from USER HABITS collection
        const habit = await AddedHabitCOLL.findOne({ _id: new ObjectId(id) });
        if (!habit) return res.status(404).send({ message: "Habit not found" });

        // Initialize array if undefined
        if (!habit.completionHistory) habit.completionHistory = [];

        // Prevent duplicate same-day completion
        if (habit.completionHistory.includes(todayStr)) {
          return res.status(400).send({ message: "Already completed today!" });
        }

        // Push today's date
        await AddedHabitCOLL.updateOne(
          { _id: new ObjectId(id) },
          { $push: { completionHistory: todayStr } }
        );

        // Fetch updated habit
        const updatedHabit = await AddedHabitCOLL.findOne({
          _id: new ObjectId(id),
        });

        // Calculate streak
        const sortedDates = updatedHabit.completionHistory
          .map((d) => new Date(d))
          .sort((a, b) => b - a);

        let streak = 0;
        let prevDate = new Date();
        for (let date of sortedDates) {
          const diff = (prevDate - date) / (1000 * 60 * 60 * 24);
          if (diff === 0 || diff === 1) {
            streak++;
            prevDate = date;
          } else break;
        }

        res.send({
          message: "Habit marked complete!",
          completionHistory: updatedHabit.completionHistory,
          streak,
        });
      } catch (err) {
        console.error("Error completing user habit:", err);
        res
          .status(500)
          .send({ message: "Internal Server Error", error: err.message });
      }
    });

    app.get("/UserData/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await publicHabitsCOLL.findOne({
          _id: new ObjectId(id),
        });
        if (!result)
          return res.status(404).send({ message: "Habit not found" });
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    app.get("/UserDat/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await AddedHabitCOLL.findOne({
          _id: new ObjectId(id),
        });
        if (!result)
          return res.status(404).send({ message: "Habit not found" });
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });
  

    app.get("/UserData/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await AddedHabitCOLL.findOne({ _id: new ObjectId(id) });
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

    // Mark habit complete
    // PATCH /habitDetails/:id/complete
    app.patch("/habitDetails/:id/complete", async (req, res) => {
      const { id } = req.params;
      const todayStr = new Date().toDateString();

      try {
        // Find habit with string id
        const habit = await publicHabitsCOLL.findOne({ _id: id }); // <-- no ObjectId
        if (!habit) return res.status(404).send({ message: "Habit not found" });

        if (!habit.completionHistory) habit.completionHistory = [];

        if (habit.completionHistory.includes(todayStr)) {
          return res.status(400).send({ message: "Already completed today!" });
        }

        // Push today's date
        await publicHabitsCOLL.updateOne(
          { _id: id }, // <-- no ObjectId
          { $push: { completionHistory: todayStr } }
        );

        const updatedHabit = await publicHabitsCOLL.findOne({ _id: id });

        // Calculate streak
        const sortedDates = updatedHabit.completionHistory
          .map((d) => new Date(d))
          .sort((a, b) => b - a);

        let streak = 0;
        let prevDate = new Date();
        for (let date of sortedDates) {
          const diff = (prevDate - date) / (1000 * 60 * 60 * 24);
          if (diff === 0 || diff === 1) {
            streak++;
            prevDate = date;
          } else break;
        }

        res.send({ completionHistory: updatedHabit.completionHistory, streak });
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
