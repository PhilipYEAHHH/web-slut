const express = require("express");
const sqlite3 = require("sqlite3");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());


db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  urgency INTEGER NOT NULL,
  done BOOLEAN NOT NULL
);
`);

app.get('/', (req, res) => {
  res.send('Todo');
});


app.post("/tasks", (req, res) => {
  const { category } = req.query;

  let sql = "SELECT * FROM tasks";
  let params = [];

  if (category) {
    sql += " WHERE category = ?";
    params.push(category);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json(rows);
  });
});

app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) return res.status(404).json({ error: "Task not found" });

    res.status(200).json(row);
  });
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;

  // Validation
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const query = "INSERT INTO tasks (title) VALUES (?)";

  db.run(query, [title], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      title,
      completed: 0
    });
  });
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});