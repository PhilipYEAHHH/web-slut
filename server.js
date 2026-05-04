const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post("/tasks", (req, res) => {
  const action = req.body.action;
  res.send(`Received action: ${action}`);
});
