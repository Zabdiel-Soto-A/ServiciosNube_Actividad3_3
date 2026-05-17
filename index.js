const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render cloud connections
  }
});

// Set EJS as the templating engine for dynamic HTML
app.set('view engine', 'ejs');

// Main route to fetch and display books
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT title, author FROM books ORDER BY title ASC;');
    res.render('index', { books: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data from the library database.");
  }
});

app.listen(port, () => {
  console.log(`Library app listening at http://localhost:${port}`);
});