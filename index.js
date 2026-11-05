import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  await client.connect();
  console.log("You successfully connected to MongoDB!");
  return client;
}

let eventsCollection;

try {
  const mongoClient = await connectToMongoDB();
  const db = mongoClient.db("unityup");
  eventsCollection = db.collection("events");
} catch (error) {
  console.error("MongoDB connection failed. The API cannot start:", error);
  process.exit(1);
}

app.post("/add-event", async (req, res) => {
  const { title, type, date, location, imageUrl, description } = req.body;

  if (!title || !type || !date || !location || !imageUrl || !description) {
    return res.status(400).send({
      message: "title, type, date, location, imageUrl, and description are required",
    });
  }

  try {
    const event = {
      title: String(title).trim(),
      type: String(type).trim(),
      date: String(date).trim(),
      location: String(location).trim(),
      imageUrl: String(imageUrl).trim(),
      description: String(description).trim(),
      createdAt: new Date(),
    };

    const result = await eventsCollection.insertOne(event);

    return res.status(201).send({
      message: "Event created successfully.",
      event: { ...event, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    return res.status(500).send({ message: "Unable to create event" });
  }
});

app.put("/events/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid event id" });
  }

  const { title, type, date, location, imageUrl, description } = req.body;
  if (!title || !type || !date || !location || !imageUrl || !description) {
    return res.status(400).send({
      message: "title, type, date, location, imageUrl, and description are required",
    });
  }

  try {
    const event = {
      title: String(title).trim(),
      type: String(type).trim(),
      date: String(date).trim(),
      location: String(location).trim(),
      imageUrl: String(imageUrl).trim(),
      description: String(description).trim(),
    };

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: event },
    );

    if (!result.matchedCount) {
      return res.status(404).send({ message: "Event not found" });
    }

    return res.send({
      message: "Event updated successfully",
      event: { ...event, _id: id },
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    return res.status(500).send({ message: "Unable to update event" });
  }
});

app.delete("/events/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid event id" });
  }

  try {
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return res.status(404).send({ message: "Event not found" });
    }

    return res.send({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return res.status(500).send({ message: "Unable to delete event" });
  }
});

app.get("/events", async (req, res) => {
  const events = await eventsCollection.find({}).toArray();
  res.send(events);
});

app.get("/events/:id", async (req, res) => {
  const {id} = req.params;
  const result = await eventsCollection.findOne({_id: new ObjectId(id)});
  res.send(result);
});

app.patch("/events/:id", async (req, res) => {
  const {id} = req.params;
  const data = req.body;
  const result = await eventsCollection.updateOne({_id: new ObjectId(id)}, {$set: data});
  res.send(result);

})

app.get("/", (req, res) => {
  res.send({ message: "UnityUp API is running" });
});

app.get("/health", async (req, res) => {
  try {
    await client.db("unityup").command({ ping: 1 });
    res.send({ ok: true, database: "connected" });
  } catch (error) {
    res.status(503).send({ ok: false, database: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
