const express = require("express");
const app = express();
const path = require("path");

const PORT = process.env.PORT || 3000;

// Static fayllar
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html")); // Əgər views kök kataloqda olarsa
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "admin.html")); // Əgər admin.html public/views-dədirsə
});
app.get("/add", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "add.html")); // Əgər admin.html public/views-dədirsə
});
app.get("/post-details/:title", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "post-details.html")); // Əgər admin.html public/views-dədirsə
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
