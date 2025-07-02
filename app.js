const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const db = new sqlite3.Database('./database.db');

// 🔐 Admin və /add səhifələrini parolla qoruyuruq
app.use(['/admin', '/add'], basicAuth({
    users: { 'admin': '12345' }, // şifrəni istəyə uyğun dəyiş
    challenge: true,
    unauthorizedResponse: 'İcazəniz yoxdur!'
}));

// Middleware-lər
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 📦 Multer ilə şəkil yükləmə ayarları
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 🗃️ SQLite verilənlər bazası cədvəlini yarat
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

// 🏠 Ana səhifə
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 📄 Bütün postları JSON kimi göstər
app.get('/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// 🔍 Tək post
app.get('/post/:title', (req, res) => {
    const postTitle = req.params.title.replace(/-/g, '').trim().toLowerCase();
    db.get('SELECT * FROM posts WHERE TRIM(LOWER(title)) = ?', [postTitle], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Post Not Found' });
        res.json(row);
    });
});

// 📝 Post detal səhifəsi (HTML)
app.get('/post-details/:title', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'post-details.html'));
});

// 🔐 Admin paneli (şifrə tələb olunur)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// 🔐 Post əlavə et səhifəsi (şifrə tələb olunur)
app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'add.html'));
});

// ➕ Post əlavə etmə (form vasitəsilə)
app.post('/add', upload.single('image'), (req, res) => {
    const { title, category, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
        `INSERT INTO posts (title, category, content, image, created_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [title, category, content, image],
        (err) => {
            if (err) return res.status(500).send("Database Error");
            res.redirect('/');
        }
    );
});



// ❌ Post silmə
app.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Post deleted successfully' });
    });
});
app.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Axtarış sorğusu göndərilməyib.' });

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    db.all(`
        SELECT * FROM posts 
        WHERE LOWER(title) LIKE ? 
           OR LOWER(category) LIKE ? 
           OR LOWER(content) LIKE ?
        ORDER BY created_at DESC
    `, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// 🚀 Serveri işə sal
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server işləyir: http://localhost:${PORT}`);
});
