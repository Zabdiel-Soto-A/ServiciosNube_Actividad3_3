const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse form submissions and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Set EJS templating engine
app.set('view engine', 'ejs');

// 1. READ ALL & READ SINGLE (Query all or search by title/author)
app.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let queryText = 'SELECT * FROM books ORDER BY title ASC;';
    let queryParams = [];

    // If a search query is provided, filter results
    if (search) {
      queryText = 'SELECT * FROM books WHERE title ILIKE $1 OR author ILIKE $1 ORDER BY title ASC;';
      queryParams = [`%${search}%`];
    }

    const result = await pool.query(queryText, queryParams);
    res.render('index', { books: result.rows, searchQuery: search || '' });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching books from the database.");
  }
});

// 2. CREATE (Add a new book)
app.post('/books/add', async (req, res) => {
  const { title, author } = req.body;
  try {
    await pool.query('INSERT INTO books (title, author) VALUES ($1, $2);', [title, author]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding the book.");
  }
});

// 3. EDIT PAGE (Fetch a single book data to display in an edit form)
app.get('/books/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1;', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send("Book not found.");
    }
    
    res.render('edit', { book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching book for editing.");
  }
});

// 4. UPDATE (Save the changes made to a book)
app.post('/books/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author } = req.body;
  try {
    await pool.query('UPDATE books SET title = $1, author = $2 WHERE id = $3;', [title, author, id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating the book.");
  }
});

// 5. DELETE (Remove a record)
app.post('/books/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM books WHERE id = $1;', [id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting the book.");
  }
});

app.listen(port, () => {
  console.log(`Library CRUD app listening at http://localhost:${port}`);
});