const Database = require('better-sqlite3');               // 1. Import the SQLite library to read the database
const db = new Database('contacts.db', { readonly: true }); // 2. Open the database file (read-only for safety)
const rows = db.prepare('SELECT * FROM messages').all();   // 3. Fetch all saved contacts from the table
console.table(rows);                                      // 4. Display the data as a beautiful, aligned table
db.close();                                               // 5. Close the connection when done