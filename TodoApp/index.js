const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const TodoTask = require("./models/TodoTask");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB using mongoose
mongoose.connect(process.env.DB_CONNECT)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => {
    console.error("Could not connect to MongoDB", err);
    process.exit(1); // Exit the process with failure
  });

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Middleware for serving static files
app.use('/static', express.static('public'));

// Set the view engine to EJS
app.set("view engine", "ejs");

// GET request handler for the home page
app.get("/", async (req, res) => {
  try {
    const tasks = await TodoTask.find();
    res.render("todo.ejs", { todoTasks: tasks, error: undefined });
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    res.status(500).send("Server Error");
  }
});

// POST request handler to add a new task
app.post("/", async (req, res) => {
  const content = req.body.content;
  if (!content) {
    const tasks = await TodoTask.find();
    return res.render("todo.ejs", { todoTasks: tasks, error: true });
  }
  
  const todoTask = new TodoTask({
    content: content
  });
  try {
    await todoTask.save();
    res.redirect("/"); // Redirect after successful form submission
  } catch (err) {
    console.error("Failed to save task:", err);
    res.status(500).send("Server Error");
  }
});

// Routes for editing tasks
app.route("/edit/:id")
  .get(async (req, res) => {
    const id = req.params.id;
    try {
      const task = await TodoTask.findById(id); // Fetch the task to be edited
      const tasks = await TodoTask.find();
      if (!task) {
        return res.status(404).send("Task not found");
      }
      res.render("todoEdit.ejs", { todoTasks: tasks, idTask: id, currentTask: task });
    } catch (err) {
      console.error("Failed to fetch tasks for editing:", err);
      res.status(500).send("Server Error");
    }
  })
  .post(async (req, res) => {
    const id = req.params.id;
    try {
      await TodoTask.findByIdAndUpdate(id, { content: req.body.content });
      res.redirect("/");
    } catch (err) {
      console.error("Failed to update task:", err);
      res.status(500).send(err);
    }
  });

// Route for deleting tasks
app.route("/remove/:id").get(async (req, res) => {
  const id = req.params.id;
  try {
    await TodoTask.findByIdAndDelete(id);
    res.redirect("/");
  } catch (err) {
    console.error("Failed to delete task:", err);
    res.status(500).send(err);
  }
});

// Start the server on the specified port
const port = process.env.PORT || 1234;
app.listen(port, () => console.log(`Server running on port ${port}`));
