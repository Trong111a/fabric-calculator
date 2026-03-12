const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Không có token' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await query(
            'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ' });
    }
};

module.exports = { auth };