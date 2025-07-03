const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3").verbose(); // SQLite3 modulu idxal edin

const db = new sqlite3.Database('./database.db'); // Verilənlər bazası təyin edin

const PORT = process.env.PORT || 3000;

// Static fayllar
app.use(express.static(path.join(__dirname, "public")));

// Rotlar
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,  "views", "index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname,  "views", "admin.html"));
});
app.get("/add", (req, res) => {
  res.sendFile(path.join(__dirname,  "views", "add.html"));
});
app.get("/post/:title'", (req, res) => {
  res.sendFile(path.join(__dirname,  "views", "post-details.html"));
});

// Posts API
app.get('/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});