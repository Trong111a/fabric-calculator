const express = require('express');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/:projectId', auth, async (req, res) => {
    try {
        const result = await query(
            `SELECT fc.* FROM fabric_calculations fc
             JOIN projects p ON fc.project_id = p.id
             WHERE fc.project_id = $1 AND p.user_id = $2`,
            [req.params.projectId, req.user.id]
        );
        if (result.rows.length === 0)
            return res.json(null);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get fabric calc error:', err);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

// POST /api/fabric-calculations/:projectId (upsert)
router.post('/:projectId', auth, async (req, res) => {
    try {
        const { kho_vai, hao_phi_norm, norm_result, order_qty, hao_phi_vai, fabric_result, btp_pct, bien_vai, area_source, norm_result_scan, fabric_result_scan, 
        norm_result_polygon, fabric_result_polygon } = req.body;

        // Kiểm tra project thuộc user
        const proj = await query(
            'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.projectId, req.user.id]
        );
        if (proj.rows.length === 0)
            return res.status(404).json({ code: 'NOT_FOUND' });

        const result = await query(
            `INSERT INTO fabric_calculations 
                (project_id, user_id, kho_vai, hao_phi_norm, norm_result, order_qty, hao_phi_vai, fabric_result, btp_pct, bien_vai, area_source, norm_result_scan, fabric_result_scan, norm_result_polygon, fabric_result_polygon)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (project_id) DO UPDATE SET
                kho_vai = EXCLUDED.kho_vai,
                hao_phi_norm = EXCLUDED.hao_phi_norm,
                norm_result = EXCLUDED.norm_result,
                order_qty = EXCLUDED.order_qty,
                hao_phi_vai = EXCLUDED.hao_phi_vai,
                fabric_result = EXCLUDED.fabric_result,
                btp_pct = EXCLUDED.btp_pct,
                bien_vai = EXCLUDED.bien_vai,
                area_source = EXCLUDED.area_source,
                norm_result_scan = EXCLUDED.norm_result_scan,
                fabric_result_scan = EXCLUDED.fabric_result_scan,
                norm_result_polygon = EXCLUDED.norm_result_polygon,
                fabric_result_polygon = EXCLUDED.fabric_result_polygon,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.params.projectId, req.user.id, kho_vai, hao_phi_norm,
             norm_result?? null, order_qty ?? null, hao_phi_vai, fabric_result ?? null, btp_pct ?? null, bien_vai ?? null, area_source ?? 'scan', 
             norm_result_scan ?? null, fabric_result_scan ?? null, norm_result_polygon ?? null, fabric_result_polygon ?? null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Save fabric calc error:', err);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

module.exports = router;