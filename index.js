const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg"); // ✅ PostgreSQL client

const app = express();
const port = process.env.PORT || 3000;

// Middleware: simple logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// PostgreSQL connection pool (Render will provide env vars)
const db = new Pool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // ✅ fixed name
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false },
});


// Test connection
db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection failed:", err));

// Import school routes and pass db connection
const schoolRoutes = require("./routes/schoolRoutes")(db);
app.use("/api", schoolRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("🎓 Welcome to the School Management API");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
