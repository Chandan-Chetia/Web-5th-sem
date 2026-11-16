// Import the Express framework — a minimal web server for Node.js
const express = require('express');

// Import better-sqlite3 — a synchronous SQLite database driver for Node.js
const Database = require('better-sqlite3');

// Create an Express application instance
const app = express();

// Open (or create) the SQLite database file "college.db" in the current directory
const db = new Database('college.db');   // creates the file if it doesn't exist

// Run a raw SQL statement to create the "students" table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS students (        -- only create if the table is missing
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- auto-incrementing unique ID
    name TEXT NOT NULL,                         -- student's full name (required)
    department TEXT NOT NULL,                   -- department (required)
    email TEXT NOT NULL,                        -- email address (required)
    phone TEXT NOT NULL,                        -- phone number (required)
    address TEXT NOT NULL,                      -- postal address (required)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP   -- timestamp of insertion, filled automatically
  )
`);

// Register middleware to automatically parse incoming JSON request bodies
app.use(express.json());

// Register middleware to serve static files (index.html, style.css, script.js) from the "public" folder
app.use(express.static('public'));   // serves index.html, style.css, script.js

// Define a POST endpoint to save a new student registration
app.post('/api/register', (req, res) => {
  // Destructure the expected fields from the request body
  const { name, department, email, phone, address } = req.body;

  // Validate: if any required field is missing, respond with 400 Bad Request
  if (!name || !department || !email || !phone || !address) {
    return res.status(400).json({ error: 'Please fill all the fields' });
  }

  // Prepare and execute an INSERT statement using parameter binding to avoid SQL injection
  const result = db
    .prepare('INSERT INTO students (name, department, email, phone, address) VALUES (?, ?, ?, ?, ?)')
    .run(name, department, email, phone, address);

  // Respond with the auto-generated ID of the newly inserted row
  res.json({ id: result.lastInsertRowid });
});

// Define a GET endpoint to list all student registrations (open http://localhost:3000/api/register)
app.get('/api/register', (req, res) => {
  // Query all rows from "students" (newest first) and send them back as JSON
  res.json(db.prepare('SELECT * FROM students ORDER BY id DESC').all());
});

// Start the HTTP server on port 3000 and log a startup message
app.listen(3000, () => console.log('Server running at http://localhost:3000'));