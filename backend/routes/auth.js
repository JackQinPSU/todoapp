const express = require('expresss');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

//Generate JWS token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d'}
    );
};

//Register New User
router.post('/register', [
    //Check input validation with the express validator
    body('name')
        .trim()
        .isLength({min: 2, max: 50})
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({min: 6})
        .withMessage('Please must be at least 6 characters long'),
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation falsed',
                details: errors.array()
            });
        }

        const { name, email, password } = req.body;

        //Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        //Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //Create User
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email, created_at',
            [name, email, hashedPassword]
        );

        const user = result.rows[0]

        //Generate JWT token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error': error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
} );

//Login User
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        //Find user by email
        const result = await pool.query(
            'SELECT id, name, email, password FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        //Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        //Generate JWT token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch(error) {
        console.error('Login error', errpr)
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});