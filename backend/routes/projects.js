const express = require('express');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*, 
                COUNT(pm.measurement_id) as file_count,
                COALESCE(SUM(m.area_cm2 * m.quantity), 0) as total_area_cm2,
                COALESCE(SUM(m.quantity), 0) as total_quantity
             FROM projects p
             LEFT JOIN project_measurements pm ON p.id = pm.project_id
             LEFT JOIN measurements m ON pm.measurement_id = m.id
             WHERE p.user_id = $1 AND p.status = 'active'
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name)
            return res.status(400).json({ code: 'MISSING_DATA' });

        const result = await query(
            `INSERT INTO projects (user_id, name, description) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [req.user.id, name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const projectResult = await query(
            `SELECT p.*, 
                COALESCE(SUM(m.area_cm2 * m.quantity), 0) as total_area_cm2,
                COALESCE(SUM(m.quantity), 0) as total_quantity
             FROM projects p
             LEFT JOIN project_measurements pm ON p.id = pm.project_id
             LEFT JOIN measurements m ON pm.measurement_id = m.id
             WHERE p.id = $1 AND p.user_id = $2
             GROUP BY p.id`,
            [req.params.id, req.user.id]
        );

        if (projectResult.rows.length === 0)
            return res.status(404).json({ code: 'NOT_FOUND' });

        const measurementsResult = await query(
            `SELECT m.* 
             FROM measurements m
             JOIN project_measurements pm ON m.id = pm.measurement_id
             WHERE pm.project_id = $1
             ORDER BY m.created_at DESC`,
            [req.params.id]
        );

        res.json({
            ...projectResult.rows[0],
            measurements: measurementsResult.rows
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name && description == null)
            return res.status(400).json({ code: 'MISSING_DATA' });

        const result = await query(
            `UPDATE projects 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description)
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [name, description, req.params.id, req.user.id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ code: 'NOT_FOUND' });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.post('/:id/measurements', auth, async (req, res) => {
    try {
        const { measurement_id } = req.body;

        if (!measurement_id)
            return res.status(400).json({ code: 'MISSING_DATA' });

        await query(
            `INSERT INTO project_measurements (project_id, measurement_id) 
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [req.params.id, measurement_id]
        );

        res.json({ code: 'ADDED' });
    } catch (error) {
        console.error('Add measurement to project error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await query(
            `UPDATE projects SET status = 'deleted' WHERE id = $1 AND user_id = $2 RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ code: 'NOT_FOUND' });

        res.json({ code: 'DELETED' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

module.exports = router;