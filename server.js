const express    = require("express");
const path       = require("path");
const fs         = require("fs");
const bodyParser = require("body-parser");
const multer     = require("multer");
const sqlite3    = require("sqlite3").verbose();

const app = express();

// 1) PUBLIC & UPLOADS QOVLUĞUNU YOXLA / YARAT
const publicDir  = path.join(__dirname, "public");
const uploadsDir = path.join(publicDir, "uploads");

// public/uploads qovluğu yoxdursa, yaradılır
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads folder at", uploadsDir);
}

// 2) SQLITE DB AÇILMASI + TABLE YARADILMASI
const dbPath = path.join(__dirname, "database.db");
console.log("→ Opening SQLite DB at:", dbPath);

const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("❌ Failed to open DB:", err);
      process.exit(1); // işləmək mənasızdı
    }
    console.log("✅ SQLite DB opened");

    // TABLE YARATMA
    db.run(
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category TEXT,
        content TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err2) => {
        if (err2) console.error("❌ Table creation error:", err2);
        else console.log("✅ Table 'posts' ready");
      }
    );
  }
);

// 3) MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicDir));

// 4) SLUG FUNKSİYASI
function slugify(text) {
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// 5) MULTER CONFIG
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 6) ROUTES

// Ana səhifə
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// Yeni post formu
app.get("/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "add.html"));
});

// Posts API
app.get("/posts", (req, res) => {
  db.all(
    "SELECT * FROM posts ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ DB error in GET /posts:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
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
    function (err) {
      if (err) {
        console.error("❌ DB error in POST /add:", err);
        return res.status(500).send(err.message);
      }
      res.redirect(`/post-details/${slug}`);
    }
  );
});

// Post detalları
app.get("/post-details/:slug", (req, res) => {
  const { slug } = req.params;
  db.get(
    "SELECT * FROM posts WHERE slug = ?",
    [slug],
    (err, row) => {
      if (err) {
        console.error(`❌ DB error in GET /post-details/${slug}:`, err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.warn(`⚠️  Post not found for slug: ${slug}`);
        return res.status(404).send("Post tapılmadı");
      }
      res.sendFile(path.join(__dirname, "views", "post-details.html"));
    }
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("404 — Səhifə tapılmadı");
});

// 7) SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
