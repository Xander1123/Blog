const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const bodyParser = require("body-parser");

const db = new sqlite3.Database('./database.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const PORT = process.env.PORT || 3000;

// Middleware-lər
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Multer ilə şəkil yükləmə
const storage = multer.diskStorage({
  destination: path.join(__dirname, "public", "uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Rotlar
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});
app.get("/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "add.html"));
});
app.get("/post-details/:title", (req, res) => {
  const postTitle = req.params.title.replace(/-/g, ' ').trim().toLowerCase();
  db.get('SELECT * FROM posts WHERE TRIM(LOWER(title)) = ?', [postTitle], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Post not found' });
    res.sendFile(path.join(__dirname, "views", "post-details.html"));
  });
});
app.get("/post/:title", (req, res) => {
  const postTitle = req.params.title.replace(/-/g, ' ').trim().toLowerCase();
  db.get('SELECT * FROM posts WHERE TRIM(LOWER(title)) = ?', [postTitle], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Post not found' });
    res.sendFile(path.join(__dirname, "views", "post-details.html"));
  });
});

// Posts API
app.get('/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Post əlavə etmə
app.post("/add", upload.single("image"), (req, res) => {
  const { title, category, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO posts (title, category, content, image, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [title, category, content, image],
    (err) => {
      if (err) return res.status(500).send("Database Error");
      res.redirect("/");
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});