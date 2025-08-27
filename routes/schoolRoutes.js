const express = require("express");
const { getDistance } = require("geolib");

const router = express.Router();

module.exports = (db) => {
  // Add School (POST)
  router.post("/addSchool", async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Latitude and Longitude must be numbers" });
    }

    try {
      const sql = `INSERT INTO schools (name, address, latitude, longitude) 
                   VALUES ($1, $2, $3, $4) RETURNING id`;
      const result = await db.query(sql, [name, address, latitude, longitude]);

      res.status(201).json({
        message: "School added successfully",
        schoolId: result.rows[0].id, // ✅ PostgreSQL uses RETURNING
      });
    } catch (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // List Schools (GET)
  router.get("/listSchools", async (req, res) => {
    console.log("✅ GET /listSchools called with query:", req.query);
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ error: "Latitude and Longitude must be numbers." });
    }

    try {
      const sql = "SELECT * FROM schools";
      const results = await db.query(sql);

      const schoolsWithDistance = results.rows.map((school) => {
        const distance = getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: school.latitude, longitude: school.longitude }
        );

        return { ...school, distanceInMeters: distance };
      });

      // Sort by nearest
      schoolsWithDistance.sort((a, b) => a.distanceInMeters - b.distanceInMeters);

      res.json({ schools: schoolsWithDistance });
    } catch (err) {
      console.error("Error fetching schools:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Update School (PUT)
  router.put("/updateSchool/:id", async (req, res) => {
    const { id } = req.params;
    const { name, address, latitude, longitude } = req.body;

    try {
      const sql = `UPDATE schools 
                   SET name=$1, address=$2, latitude=$3, longitude=$4 
                   WHERE id=$5 RETURNING *`;
      const result = await db.query(sql, [name, address, latitude, longitude, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      res.json({ message: "School updated successfully" });
    } catch (err) {
      console.error("Error updating school:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Delete School (DELETE)
  router.delete("/deleteSchool/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const sql = "DELETE FROM schools WHERE id = $1 RETURNING *";
      const result = await db.query(sql, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      res.json({ message: "School deleted successfully" });
    } catch (err) {
      console.error("Error deleting school:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  return router;
};
