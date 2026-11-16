// Import the Express framework — a minimal web server for Node.js
const express = require('express');

// Import better-sqlite3 — a synchronous SQLite database driver for Node.js
const Database = require('better-sqlite3');

// Create an Express application instance
const app = express();

// Open (or create) the SQLite database file "orders.db" in the current directory
const db = new Database('orders.db');   // creates the file if it doesn't exist

// Run a raw SQL statement to create the "orders" table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (          -- only create if the table is missing
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- auto-incrementing unique order ID
    name TEXT NOT NULL,                         -- customer's full name (required)
    phone TEXT NOT NULL,                        -- customer's phone number (required)
    address TEXT NOT NULL,                      -- delivery address (required)
    item TEXT NOT NULL,                         -- name of the item ordered (required)
    quantity INTEGER NOT NULL,                  -- number of items ordered (required)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP   -- timestamp of order creation, filled automatically
  )
`);

// Register middleware to automatically parse incoming JSON request bodies
app.use(express.json());

// Register middleware to serve static files (index.html, style.css, script.js) from the "public" folder
app.use(express.static('public'));   // serves index.html, style.css, script.js

// Define a POST endpoint to save a new order
app.post('/api/orders', (req, res) => {
  // Destructure the expected fields from the request body
  const { name, phone, address, item, quantity } = req.body;

  // Validate: if any required field is missing (or falsy), respond with 400 Bad Request
  if (!name || !phone || !address || !item || !quantity) {
    return res.status(400).json({ error: 'Please fill all the fields' });
  }

  // Prepare and execute an INSERT statement using parameter binding to avoid SQL injection
  const result = db
    .prepare('INSERT INTO orders (name, phone, address, item, quantity) VALUES (?, ?, ?, ?, ?)')
    // .run binds the values in order; Number(quantity) ensures quantity is stored as an integer
    .run(name, phone, address, item, Number(quantity));

  // Respond with the auto-generated ID of the newly inserted order row
  res.json({ id: result.lastInsertRowid });
});

// Define a GET endpoint to list all orders (open http://localhost:3000/api/orders)
app.get('/api/orders', (req, res) => {
  // Query all rows from "orders" (newest first) and send them back as JSON
  res.json(db.prepare('SELECT * FROM orders ORDER BY id DESC').all());
});

// Start the HTTP server on port 3000 and log a startup message
app.listen(3000, () => console.log('Server running at http://localhost:3000'));