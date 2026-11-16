// Import Express — a minimal web framework for Node.js
const express = require('express');

// Import better-sqlite3 — a synchronous SQLite driver (writes straight to disk)
const Database = require('better-sqlite3');

// Create an Express application instance
const app = express();

// Open (or create) the SQLite database file "contacts.db" in the current directory
const db = new Database('contacts.db');   // creates the file if it doesn't exist

// Run a raw SQL statement to create the "messages" table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (        -- only create if the table is missing
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- auto-incrementing unique message ID
    name TEXT NOT NULL,                         -- sender's name (required)
    email TEXT NOT NULL,                        -- sender's email (required)
    message TEXT NOT NULL,                      -- the message body (required)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP   -- insertion timestamp, filled automatically
  )
`);

// Middleware: automatically parse incoming JSON request bodies
app.use(express.json());

// Middleware: serve static files (index.html, style.css, script.js) from the "public" folder
app.use(express.static('public'));   // serves index.html, style.css, script.js

// Define a POST endpoint to save a new contact message
app.post('/api/contact', (req, res) => {
  // Destructure the expected fields from the request body
  const { name, email, message } = req.body;

  // Validate: if any required field is missing (or falsy), respond with 400 Bad Request
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please fill all the fields' });
  }

  // Prepare and execute an INSERT using bound parameters (safe against SQL injection);
  // no result is kept because the response only needs a success flag
  db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)')
    .run(name, email, message);

  // Respond with a simple success flag
  res.json({ success: true });
});

// Define a GET endpoint to list all messages (open http://localhost:3000/api/contact)
app.get('/api/contact', (req, res) => {
  // Query all rows from "messages" (newest first) and send them back as JSON
  res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all());
});

// Start the HTTP server on port 3000 and log a startup message
app.listen(3000, () => console.log('Server running at http://localhost:3000'));