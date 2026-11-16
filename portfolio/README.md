# Personal Portfolio – Node.js + SQLite

A one-page portfolio with a contact form. Messages sent from the form are saved in a SQLite database.

## Screenshots

### Home page
![Book World home page](images/index.png)

### Order form (popup)
![Order form popup](images/form.png)

### Output — saved order / orders list
![Saved order output](images/output.png)

## Folder structure

```
portfolio/
├── server.js        ← Node server + SQLite database code
├── package.json     ← project info and dependencies
├── README.md        ← this file
└── public/
    ├── index.html   ← the website
    ├── style.css    ← the styles
    └── script.js    ← nav highlight + contact form logic
```

## 1. Requirements

- Node.js 18 or newer – check with `node -v` (download from https://nodejs.org)

## 2. Run the project
```
cd 'c:/Users/chand/OneDrive/Desktop/B Tech/5th sem/WEB-Lab/25/portfolio'
```

Open a terminal inside the `portfolio` folder:

```bash
npm install
npm start
```

You should see: `Server running at http://localhost:3000`

Open http://localhost:3000 in your browser. Press `Ctrl + C` to stop the server.

> Open the site through `http://localhost:3000`, not by double-clicking `index.html`, otherwise the form cannot reach the server.

## 3. Send a message

Scroll to **Contact Me**, fill in name, email and message, and click **Send Message**.
The message is saved in `contacts.db` (created automatically on first run).

## 4. See the database in the terminal

```
node view_data.js
```
or
```bash
sqlite3 -header -column contacts.db "SELECT * FROM messages;"
```

## 5. Reset everything

Stop the server and delete `contacts.db`. A new empty one is created on the next start.

## Troubleshooting

- **`npm` is not recognized** → install Node.js and reopen the terminal.
- **Port 3000 already in use** → close the other program or change `3000` at the bottom of `server.js`.
- **Form says "Something went wrong"** → make sure the server is running and you opened `http://localhost:3000`.
