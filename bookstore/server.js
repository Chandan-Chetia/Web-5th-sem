// Import Express — a minimal web framework for Node.js
const express = require('express');

// Import better-sqlite3 — a synchronous SQLite driver (writes straight to disk)
const Database = require('better-sqlite3');

// Create an Express application instance
const app = express();

// Open (or create) the SQLite database file "bookstore.db" in the current directory
const db = new Database('bookstore.db');   // creates the file if it doesn't exist

// Server-side price list — client sends only the book name, so the browser can't tamper with prices
// Book prices are kept on the server so they can't be changed from the browser
const prices = {
  'Web Technology': 450,      // price per copy (in currency units)
  'Python Programming': 500,  // price per copy
  'Computer Networks': 400,   // price per copy
  'Database Systems': 550     // price per copy
};

// Run a raw SQL statement to create the "orders" table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (          -- only create if the table is missing
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- auto-incrementing unique order ID
    name TEXT NOT NULL,                         -- customer name (required)
    phone TEXT NOT NULL,                        -- customer phone (required)
    address TEXT NOT NULL,                      -- delivery address (required)
    book TEXT NOT NULL,                         -- ordered book title (required)
    quantity INTEGER NOT NULL,                  -- number of copies (required)
    total INTEGER NOT NULL,                     -- server-computed total (price × quantity)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP   -- insertion timestamp, filled automatically
  )
`);

// Middleware: automatically parse incoming JSON request bodies
app.use(express.json());

// Middleware: serve static files (index.html, style.css, script.js) from the "public" folder
app.use(express.static('public'));   // serves index.html, style.css, script.js

// Define a POST endpoint to save a new order
app.post('/api/orders', (req, res) => {
  // Destructure the fields the client is allowed to send (note: no "total" — server computes it)
  const { name, phone, address, book, quantity } = req.body;

  // Coerce quantity to a Number (JSON could send a string like "3")
  const qty = Number(quantity);

  // Validate presence of all required fields AND that qty is truthy (rejects 0, NaN, "", null)
  if (!name || !phone || !address || !book || !qty) {
    return res.status(400).json({ error: 'Please fill all the fields' });
  }

  // Validate that the requested book exists in the server-side price list
  if (!prices[book]) {
    return res.status(400).json({ error: 'Unknown book' });
  }

  // Compute the total on the server (never trust a client-supplied total)
  const total = prices[book] * qty;

  // Prepare and execute an INSERT using bound parameters (safe against SQL injection),
  // capturing the result so we can return the new row's ID
  const result = db
    .prepare('INSERT INTO orders (name, phone, address, book, quantity, total) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, phone, address, book, qty, total);

  // Respond with the new order ID and the server-computed total
  res.json({ id: result.lastInsertRowid, total });
});

// Define a GET endpoint to list all orders (open http://localhost:3000/api/orders)
app.get('/api/orders', (req, res) => {
  // Query all rows from "orders" (newest first) and send them back as JSON
  res.json(db.prepare('SELECT * FROM orders ORDER BY id DESC').all());
});

// Start the HTTP server on port 3000 and log a startup message
app.listen(3000, () => console.log('Server running at http://localhost:3000'));