const { pool } = require('./config/database');

const initDB = async () => {
    try {
        console.log('🚀 Initializing database...');

        // Create extension
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        // Measurements table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS measurements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255),
                image_url TEXT,
                thumbnail_url TEXT,
                area_cm2 DECIMAL(10,4) NOT NULL,
                pixels_per_cm DECIMAL(10,4) NOT NULL,
                polygon_points JSONB NOT NULL,
                image_width INTEGER,
                image_height INTEGER,
                notes TEXT,
                tags TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Projects table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Project measurements junction
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_measurements (
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                measurement_id UUID REFERENCES measurements(id) ON DELETE CASCADE,
                PRIMARY KEY (project_id, measurement_id)
            )
        `);

        // Seed data
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await pool.query(`
            INSERT INTO users (email, password_hash, name, role) 
            VALUES ('admin@example.com', $1, 'Admin', 'admin')
            ON CONFLICT (email) DO NOTHING
        `, [hashedPassword]);

        console.log('✅ Database initialized successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

initDB();