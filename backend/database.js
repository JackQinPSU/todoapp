
const { Pool } = require('pg');
require('dotenv').config();

//Creating a connection to PostgreSQL using DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Railway PostgreSQL
    }
});

// Add error handling for the pool
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

//Test the connection
pool.connect((err, client, release) => {
    if(err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to Railway PostgreSQL database');
    release();
});

// Test the connection when the module loads
pool.on('connect', () => {
    console.log('Connected to Railway PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

module.exports = pool;