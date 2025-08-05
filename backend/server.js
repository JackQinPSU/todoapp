const express = require('express');
const cors = require('cors');
const pool = require('./database');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - be more specific about origins
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Replace with your actual frontend domain
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

//Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', { ...req.body, password: req.body.password ? '[HIDDEN]' : undefined });
    }
    next();
});

//Authentication routes
app.use('/api/auth', authRoutes);

// Add a test route
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Backend is working!' });
});

// Add a database test route
app.get('/api/db-test', async (req, res) => {
    try {
        console.log('Database test endpoint hit');
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

//Add a setup route to create both users and todos tables
app.get('/api/setup', async (req, res) => {
    console.log('Setup endpoint hit');
    
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Setup not allowed in production' });
    }

    try {
        //Create users table first
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        //Create todos table with user_id reference
        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        //If todos table existed without user_id, add the column
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='todos' AND column_name='user_id'
                ) THEN
                    ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        console.log('Database setup completed successfully');
        res.json({
            success: true,
            message: 'Database tables created successfully!'
        });
    } catch(err) {
        console.error('Setup error:', err);
        res.status(500).json({
            success: false,
            error: 'Setup failed',
            details: err.message
        });
    }
});

//Routes
//PROTECTED ROUTES - Apply authentication middleware to all todo features
app.use('/api/todos', authMiddleware);

//GET all todos (filtered by user)
app.get('/api/todos', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch(err) {
        console.error('Get todos error:', err);
        res.status(500).json({success: false, error: 'Server error'});
    }
});

//POST create new todo (associated with user)
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
            'INSERT INTO todos (title, user_id) VALUES ($1, $2) RETURNING *',
            [title, req.user.id]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Create todo error:', err);
        res.status(500).json({ success: false, error: 'Server error'});
    }
});

//PUT update todo (only if belongs to user)
app.put('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, completed } = req.body;

        const result = await pool.query(
            'UPDATE todos SET title = $1, completed = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
            [title, completed, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Todo not found or access denied'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Update todo error:', err);
        res.status(500).json({ success: false, error: 'Server error'});
    }
});

//DELETE todo (only if belongs to user)
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Todo not found or access denied'
            });
        }

        res.json({
            success: true,
            message: 'Todo deleted successfully'
        });
    } catch(err) {
        console.error('Delete todo error:', err);
        res.status(500).json({ success: false, error: 'Server error'});
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

//Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
    console.log(`JWT Secret configured: ${!!process.env.JWT_SECRET}`);
});