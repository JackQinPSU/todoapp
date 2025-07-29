const express = require('express');
const cors = require('cors');
const pool = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

// Add a test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Add a database test route
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            success: true, 
            message: 'Database connected!', 
            time: result.rows[0] 
        });
    } catch (err) {
        console.error('Database test error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed', 
            details: err.message 
        });
    }
});

// Add a setup route to create the todos table (REMOVE IN PRODUCTION)
app.get('/api/setup', async (req, res) => {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Setup not allowed in production' });
    }
    
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        res.json({ 
            success: true, 
            message: 'Todos table created successfully!' 
        });
    } catch (err) {
        console.error('Setup error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Setup failed', 
            details: err.message 
        });
    }
});

// Add a cleanup route to drop the table (REMOVE IN PRODUCTION)
app.get('/api/cleanup', async (req, res) => {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Cleanup not allowed in production' });
    }
    
    try {
        await pool.query('DROP TABLE IF EXISTS todos');
        res.json({ 
            success: true, 
            message: 'Todos table deleted successfully!' 
        });
    } catch (err) {
        console.error('Cleanup error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Cleanup failed', 
            details: err.message 
        });
    }
});

// Add a route to see all tables
app.get('/api/tables', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        res.json({ 
            success: true, 
            tables: result.rows 
        });
    } catch (err) {
        console.error('Tables error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get tables', 
            details: err.message 
        });
    }
});


//Routes


//GET all todos
app.get('/api/todos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json({
            success: true,
            data: result.rows
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({success: false, error: 'Server error'});
    }
});

//POST create new todo
app.post('/api/todos', async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Title is required!'
            });
        }

        const result = await pool.query(
            'INSERT INTO todos (title) VALUES ($1) RETURNING *',
            [title]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error'});
    }
});

app.put('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, completed } = req.body;

        const result = await pool.query(
            'UPDATE todos SET title = $1, completed = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [title, completed, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Todo not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error'});
    }
});

//Delete todo 
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const{ id } = req.params;

        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Todo not found'
            });
        }

        res.json({
            success: true,
            message: 'Todos deleted successfully'
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error'});
    }
});

//Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});