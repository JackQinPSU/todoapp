const express = require('express');
const cors = require('cors');
const pool = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

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