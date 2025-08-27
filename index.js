const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");  // ✅ use pg instead of mysql2

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// PostgreSQL connection pool (use env vars on Render)
const db = new Pool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }, // ✅ required on Render
});

// Test connection
db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection failed:", err));

// Import school routes and pass db connection
const schoolRoutes = require("./routes/schoolRoutes")(db);
app.use("/api", schoolRoutes);

// Health check
app.get("/health", (req, res) => {
  res.send("Server is alive");
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
