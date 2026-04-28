const express = require('express');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');
const sharp = require('sharp');
const path = require('path');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM measurements 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get measurements error:', err);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const {
            name,
            area_cm2,
            pixels_per_cm,
            polygon_points,
            image_width,
            image_height,
            image_data,
            quantity = 1,
            project_id
        } = req.body;

        if (!name || area_cm2 == null || !pixels_per_cm || !polygon_points)
            return res.status(400).json({ code: 'MISSING_DATA' });

        if (quantity < 1 || !Number.isInteger(Number(quantity)))
            return res.status(400).json({ code: 'INVALID_QUANTITY' });

        let imageUrl = null;
        let thumbnailUrl = null;

        if (image_data) {
            const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${Date.now()}.png`;

            await sharp(buffer)
                .png()
                .toFile(`uploads/${filename}`);

            await sharp(buffer)
                .resize(300, 300, { fit: 'inside' })
                .png()
                .toFile(`uploads/thumb_${filename}`);

            imageUrl = `/uploads/${filename}`;
            thumbnailUrl = `/uploads/thumb_${filename}`;
        }

        const result = await query(
            `INSERT INTO measurements (
                user_id, name, image_url, thumbnail_url, area_cm2,
                pixels_per_cm, polygon_points, image_width, image_height, quantity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                req.user.id, name, imageUrl, thumbnailUrl, area_cm2,
                pixels_per_cm, JSON.stringify(polygon_points),
                image_width, image_height, quantity
            ]
        );

        const measurement = result.rows[0];
        if (project_id) {
            await query(
                `INSERT INTO project_measurements (project_id, measurement_id) 
                 VALUES ($1, $2)`,
                [project_id, measurement.id]
            );
        }

        res.status(201).json(measurement);
    } catch (err) {
        console.error('Create measurement error:', err);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, quantity } = req.body;

        if (!name && quantity == null)
            return res.status(400).json({ code: 'MISSING_DATA' });

        if (quantity != null && (quantity < 1 || !Number.isInteger(Number(quantity))))
            return res.status(400).json({ code: 'INVALID_QUANTITY' });

        const result = await query(
            `UPDATE measurements 
             SET name = COALESCE($1, name), 
                 quantity = COALESCE($2, quantity),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [name, quantity, id, req.user.id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ code: 'NOT_FOUND' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update measurement error:', err);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM measurements WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ code: 'NOT_FOUND' });

        res.json({ code: 'DELETED' });
    } catch (err) {
        console.error('Delete measurement error:', err);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

module.exports = router;