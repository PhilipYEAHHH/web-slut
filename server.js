const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./todos.db");
const app = express();
const PORT = 3000;

app.use(express.json());

function validateTask({ title, completed, priority, category }) {
  if (!title) return "Title is required";
  if (typeof title !== "string" || title.trim() === "")
    return "Title must be a string";

  if (completed === undefined)
    return "Completed status is required";
  if (typeof completed !== "boolean")
    return "Completed must be true or false";

  if (priority === undefined)
    return "Priority is required";
  if (typeof priority !== "number")
    return "Priority must be a number (1–5)";
  if (priority < 1 || priority > 5)
    return "Priority must be between 1 and 5";

  if (!category) return "Category is required";
  if (typeof category !== "string" || category.trim() === "")
    return "Category must be a string";

  return null;
}

function normalizeTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    priority: row.priority,
    category: row.category,
  };
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    category TEXT NOT NULL
  );`);

  db.all("PRAGMA table_info(tasks)", (err, rows) => {
    if (err) {
      console.error("Could not read table info:", err.message);
      return;
    }

    const hasCategory = rows.some((row) => row.name === "category");
    if (!hasCategory) {
      db.run(
        "ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'general'",
        (alterErr) => {
          if (alterErr) console.error("Could not add category column:", alterErr.message);
        }
      );
    }
  });
});

app.get("/", (req, res) => {
  res.send("Todo API");
});

app.get("/tasks", (req, res) => {
  const { category, completed } = req.query;

  let sql = "SELECT * FROM tasks";
  const params = [];
  const filters = [];

  if (category) {
    filters.push("category = ?");
    params.push(category);
  }

  if (completed !== undefined) {
    if (completed !== "true" && completed !== "false") {
      return res
        .status(400)
        .json({ error: "Completed query must be true or false" });
    }

    filters.push("completed = ?");
    params.push(completed === "true" ? 1 : 0);
  }

  if (filters.length) {
    sql += " WHERE " + filters.join(" AND ");
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json(rows.map(normalizeTask));
  });
});

app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) return res.status(404).json({ error: "Task not found" });

    res.status(200).json(normalizeTask(row));
  });
});

app.post("/tasks", (req, res) => {
  const { title, completed, priority, category } = req.body;

  const validationError = validateTask({ title, completed, priority, category });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const query =
    "INSERT INTO tasks (title, completed, priority, category) VALUES (?, ?, ?, ?)";

  db.run(
    query,
    [title, completed ? 1 : 0, priority, category],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json(
        normalizeTask({
          id: this.lastID,
          title,
          completed,
          priority,
          category,
        })
      );
    }
  );
});

app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, completed, priority, category } = req.body;

  const validationError = validateTask({ title, completed, priority, category });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const query =
    "UPDATE tasks SET title = ?, completed = ?, priority = ?, category = ? WHERE id = ?";

  db.run(
    query,
    [title, completed ? 1 : 0, priority, category, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.status(200).json(
        normalizeTask({
          id: Number(id),
          title,
          completed,
          priority,
          category,
        })
      );
    }
  );
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