const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');
const projectRoutes = require('./routes/projects');

const app = express();

const { initDatabase } = require('./init-db');
initDatabase()
    .then(() => console.log('✅ Database initialized'))
    .catch(err => console.error('❌ DB init error:', err.message));

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/projects', projectRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});