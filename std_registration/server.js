// Import Express — a minimal web framework for Node.js
const express = require("express");

// Import the built-in fs module — used to read/write the SQLite database file
const fs = require("fs");

// Import sql.js — a pure-JS/WASM build of SQLite (no native compilation needed)
const initSqlJs = require("sql.js");

// Import Node's path module — used to build safe, absolute file paths
const path = require("path");

// Create the Express application instance
const app = express();

// Server port — from env var PORT or default 3000; Number() ensures it's numeric
const PORT = Number(process.env.PORT || 3000);

// Resolve the absolute path of the SQLite database file
// (env var override, otherwise "std_registration.db" next to this script)
const DATABASE_PATH = path.resolve(
    process.env.STD_REGISTRATION_DB_PATH || path.join(__dirname, "std_registration.db")
);

// Temporary file used for atomic writes (write here, then rename over the real DB)
const TEMP_DATABASE_PATH = `${DATABASE_PATH}.tmp`;

// Whitelist of allowed course values (server-side validation)
const COURSES = ["B.Tech", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "BA", "MA"];

// Whitelist of allowed hobbies (server-side validation)
const HOBBIES = ["Reading", "Music", "Sports"];

// Middleware: parse JSON bodies, capped at 32 KB to prevent abuse
app.use(express.json({ limit: "32kb" }));

// Middleware: serve static assets (index.html, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Holds the sql.js Database instance; initialized in startServer()
let db;

// Helper: run a SELECT and return every row as plain objects
function queryAll(sql, parameters = []) {
    // Prepare the statement (must be freed manually to avoid WASM memory leaks)
    const statement = db.prepare(sql);
    try {
        // Bind positional parameters (safe against SQL injection)
        statement.bind(parameters);
        const rows = [];
        // Step through each result row
        while (statement.step()) {
            rows.push(statement.getAsObject());
        }
        return rows;
    } finally {
        // Always free the statement, even if an error is thrown
        statement.free();
    }
}

// Helper: run a SELECT and return just the first row (or undefined)
function queryOne(sql, parameters = []) {
    return queryAll(sql, parameters)[0];
}

// Persist the in-memory sql.js database to disk atomically
function saveDatabase() {
    // Write the exported DB bytes to the temp file first
    fs.writeFileSync(TEMP_DATABASE_PATH, Buffer.from(db.export()));
    // Rename temp → real path (atomic on the same filesystem)
    fs.renameSync(TEMP_DATABASE_PATH, DATABASE_PATH);
}

// Create or load the SQLite database and ensure the schema exists
function initializeDatabase(SQL) {
    // Load the existing DB file if present; otherwise create a fresh empty DB
    db = fs.existsSync(DATABASE_PATH)
        ? new SQL.Database(fs.readFileSync(DATABASE_PATH))
        : new SQL.Database();

    // Create the "registrations" table if it doesn't already exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,       -- unique auto-incrementing ID
            full_name TEXT NOT NULL,                    -- student's full name
            father_name TEXT NOT NULL,                  -- father's name
            date_of_birth TEXT NOT NULL,                -- ISO date string (YYYY-MM-DD)
            email TEXT NOT NULL,                        -- email address
            phone TEXT NOT NULL,                        -- 10-digit phone number
            gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),  -- constrained gender
            course TEXT NOT NULL,                       -- one of COURSES
            address TEXT NOT NULL,                      -- postal address
            hobbies TEXT NOT NULL DEFAULT '[]',         -- JSON-encoded array of hobbies
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP  -- insertion timestamp
        );
    `);
    // Persist the (possibly new) database to disk immediately
    saveDatabase();
}

// Validate a date string: must be YYYY-MM-DD, a real calendar date, and not in the future
function isValidDate(value) {
    // Reject anything not in the exact YYYY-MM-DD shape
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    // Parse as UTC midnight to avoid timezone drift
    const date = new Date(`${value}T00:00:00Z`);
    // Ensure it's a real date (e.g., rejects 2024-02-30) and normalizes back to the same string
    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value &&
        // Ensure the date is not in the future (compare to today's UTC date)
        value <= new Date().toISOString().slice(0, 10);
}

// POST endpoint: create a new student registration
app.post("/api/registrations", (req, res) => {
    // Grab the raw request body
    const student = req.body;

    // Reject anything that isn't a plain object (null, array, string, etc.)
    if (!student || typeof student !== "object" || Array.isArray(student)) {
        return res.status(400).json({
            success: false,
            message: "Invalid registration details."
        });
    }

    // Destructure the expected fields from the body
    const {
        fullName,
        fatherName,
        dateOfBirth,
        email,
        phone,
        gender,
        course,
        address,
        hobbies
    } = student;

    // Comprehensive server-side validation of every field
    const valid =
        // fullName: non-empty string up to 120 chars
        typeof fullName === "string" &&
        fullName.trim().length > 0 &&
        fullName.trim().length <= 120 &&
        // fatherName: same rules
        typeof fatherName === "string" &&
        fatherName.trim().length > 0 &&
        fatherName.trim().length <= 120 &&
        // dateOfBirth: valid past/today date
        typeof dateOfBirth === "string" &&
        isValidDate(dateOfBirth) &&
        // email: non-empty, ≤254 chars, basic email shape
        typeof email === "string" &&
        email.trim().length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
        // phone: exactly 10 digits
        typeof phone === "string" &&
        /^\d{10}$/.test(phone) &&
        // gender: one of two allowed values
        (gender === "Male" || gender === "Female") &&
        // course: must be in the whitelist
        COURSES.includes(course) &&
        // address: non-empty string up to 2000 chars
        typeof address === "string" &&
        address.trim().length > 0 &&
        address.trim().length <= 2000 &&
        // hobbies: array, bounded length, all whitelisted, no duplicates
        Array.isArray(hobbies) &&
        hobbies.length <= HOBBIES.length &&
        hobbies.every((hobby) => HOBBIES.includes(hobby)) &&
        new Set(hobbies).size === hobbies.length;

    // If validation failed, send a generic 400 (don't leak which field was bad)
    if (!valid) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid registration details."
        });
    }

    // Insert the new row using bound parameters (SQL-injection safe)
    db.run(
        `INSERT INTO registrations
            (full_name, father_name, date_of_birth, email, phone, gender, course, address, hobbies)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            fullName.trim(),               // trimmed string
            fatherName.trim(),             // trimmed string
            dateOfBirth,                   // already validated ISO date
            email.trim(),                  // trimmed email
            phone,                         // validated 10-digit string
            gender,                        // validated enum
            course,                        // validated whitelist value
            address.trim(),                // trimmed address
            JSON.stringify(hobbies)        // array stored as JSON text
        ]
    );

    // Retrieve the auto-generated ID of the newly inserted row
    const registrationId = queryOne("SELECT last_insert_rowid() AS id").id;

    // Persist the updated in-memory DB to disk
    saveDatabase();

    // Respond 201 Created with the new ID
    res.status(201).json({
        success: true,
        message: "Registration saved successfully.",
        registration_id: registrationId
    });
});

// Global error handler (must be registered after all routes)
app.use((error, req, res, next) => {
    // Use the error's status if it's a 4xx client error; otherwise fall back to 500
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
        ? error.status
        : 500;

    // Log only genuine server-side failures (helps debugging)
    if (status === 500) {
        console.error(error);
    }

    // If headers were already sent, delegate to Express's default handler
    if (res.headersSent) {
        return next(error);
    }

    // Send a safe error response (don't leak internal details)
    res.status(status).json({
        success: false,
        message: status === 400 ? "Invalid request body." : "An internal server error occurred."
    });
});

// Boot the server: init sql.js, open the DB, then listen for HTTP traffic
async function startServer() {
    // Initialize sql.js and tell it where to load the WASM binary from
    const SQL = await initSqlJs({
        locateFile: (file) => require.resolve(`sql.js/dist/${file}`)
    });

    // Create/load the DB and ensure the schema exists
    initializeDatabase(SQL);

    // Start listening on the chosen port
    app.listen(PORT, () => {
        console.log("SQLite database connected!");
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Database file: ${DATABASE_PATH}`);
    });
}

// Kick off the boot process; log and mark failure if anything throws
startServer().catch((error) => {
    console.error("Failed to start student registration server:", error);
    process.exitCode = 1;   // non-zero exit code signals startup failure
});