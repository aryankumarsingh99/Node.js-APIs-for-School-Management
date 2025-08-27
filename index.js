const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// MySQL connection (use env vars on Render)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Password",
  database: process.env.DB_NAME || "school_db",
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// Import school routes and pass db connection
const schoolRoutes = require("./routes/schoolRoutes")(db);
app.use("/api", schoolRoutes);;

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
