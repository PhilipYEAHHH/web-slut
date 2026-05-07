const express = require('express');
const app = express();
const PORT = 3000;
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./tasks.db");
app.use(express.json());


db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  urgency INTEGER NOT NULL,
  done BOOLEAN NOT NULL
);
`);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get("/", (req, res) => {
  res.send("blablablablablablabla");
});


app.post("/tasks", (req, res) => {
  const action = req.body.action;
  res.send(`Received action: ${action}`);
});
