const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
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
