const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// --- SQLite bazası ---
const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    content TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- Slug funksiyası ---
function slugify(text) {
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, "-")      // boşluqları tire ilə əvəz
    .replace(/[^\w\-]+/g, "")  // xüsusi simvolları sil
    .replace(/\-\-+/g, "-");   // təkrarlanan tireləri birləşdir
}

// --- Multer və Body Parser ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "public", "uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- Routes ---

// Ana Səhifə
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Admin Panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// Yeni Post Əlavə Formu
app.get("/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "add.html"));
});

// Post-ların JSON API
app.get("/posts", (req, res) => {
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// Yeni post yaratma
app.post("/add", upload.single("image"), (req, res) => {
  const { title, category, content } = req.body;
  const slug = slugify(title);
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO posts (title, slug, category, content, image)
     VALUES (?, ?, ?, ?, ?)`,
    [title, slug, category, content, imagePath],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      res.redirect(`/post-details/${slug}`);
    }
  );
});

// Post Detalları Səhifəsi
app.get("/post-details/:slug", (req, res) => {
  const { slug } = req.params;
  db.get("SELECT * FROM posts WHERE slug = ?", [slug], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).send("Post tapılmadı");
    res.sendFile(path.join(__dirname, "views", "post-details.html"));
  });
});

// Statik olmayan bütün GET sorğuları üçün 404
app.use((req, res) => {
  res.status(404).send("Səhifə tapılmadı (404)");
});

// Serveri işə salma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
