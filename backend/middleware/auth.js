const jwt = require('jsonwebtoken');
const pool = require('../database');

const authMiddleware = async (req, res, next) => {
    try {
        //Get token from header
        const authHeader = req.header('Authorization');

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided or invalid format'
            });
        }

        //Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        if(!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        //Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //Check if user still exists in database
        const userResult = await pool.query(
            'SELECT id, email, name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User no longer exists'
            });
        }

        //Add user info to request
        req.user = {
            id: decoded.userId,
            email: userResult.rows[0].email,
            name: userResult.rows[0].name
        };

        next();
    } catch(error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                sucess: false,
                error: 'Invalid token'
            });
        }

        if (error.name ==='TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error during authentication'
        });
    }
};