 
const express = require("express");
const { getDistance } = require("geolib");

const router = express.Router();

module.exports = (db) => {
  //  Add School (POST)
  router.post("/addSchool", (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Latitude and Longitude must be numbers" });
    }

    const sql = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, address, latitude, longitude], (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({
        message: "School added successfully",
        schoolId: result.insertId,
      });
    });
  });

  // List Schools (GET)
  router.get("/listSchools", (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ error: "Latitude and Longitude must be numbers." });
    }

    const sql = "SELECT * FROM schools";
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching schools:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const schoolsWithDistance = results.map((school) => {
        const distance = getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: school.latitude, longitude: school.longitude }
        );

        return { ...school, distanceInMeters: distance };
      });

      // Sort by nearest
      schoolsWithDistance.sort((a, b) => a.distanceInMeters - b.distanceInMeters);

      res.json({ schools: schoolsWithDistance });
    });
  });

  //Update School (PUT)
  router.put("/updateSchool/:id", (req, res) => {
    const { id } = req.params;
    const { name, address, latitude, longitude } = req.body;

    const sql = "UPDATE schools SET name=?, address=?, latitude=?, longitude=? WHERE id=?";
    db.query(sql, [name, address, latitude, longitude, id], (err, result) => {
      if (err) {
        console.error("Error updating school:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      res.json({ message: "School updated successfully" });
    });
  });

  // Delete School (DELETE)
  router.delete("/deleteSchool/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM schools WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error("Error deleting school:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "School not found" });
      }

      res.json({ message: "School deleted successfully" });
    });
  });

  // console.log(" School routes loaded: /addSchool, /listSchools, /updateSchool/:id, /deleteSchool/:id");
  return router;
};

