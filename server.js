const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// --- DB açılışı və table yaradılması ---
const dbPath = path.join(__dirname, "database.db");
console.log("→ DB path:", dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
  if (err) {
    console.error("❌ SQLite açılmadı:", err);
  } else {
    console.log("✅ SQLite açıldı");
    db.run(
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT,
        content TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      err2 => {
        if (err2) console.error("❌ Table yaradılma xətası:", err2);
        else console.log("✅ Table 'posts' mövcuddur və ya yaradıldı");
      }
    );
  }
});

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Multer
const storage = multer.diskStorage({
  destination: path.join(__dirname, "public", "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- Routes ---
app.get("/", (req, res) => {
  console.log("GET /");
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/posts", (req, res) => {
  console.log("GET /posts");
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("❌ DB error in /posts:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("→ /posts returned", rows.length, "rows");
    res.json(rows);
  });
});

// Catch‑all 404
app.use((req, res) => {
  console.log("404 for", req.method, req.url);
  res.status(404).send("404 — Səhifə tapılmadı");
});

// --- Server start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
