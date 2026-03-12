const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ── Nodemailer ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name)
            return res.status(400).json({ error: 'Thiếu thông tin' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO users (email, password_hash, name) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, name, role`,
            [email.toLowerCase(), hashedPassword, name]
        );
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ user, token });
    } catch (err) {
        if (err.code === '23505')
            return res.status(409).json({ error: 'Email đã tồn tại' });
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (result.rows.length === 0)
            return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch)
            return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        res.json({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
    res.json({ user: req.user });
});

// ── POST /api/auth/forgot-password ─────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Thiếu email' });

        const result = await query(
            'SELECT id, name FROM users WHERE email = $1 AND is_active = true',
            [email.toLowerCase()]
        );

        // Luôn trả success để tránh lộ thông tin user
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email chưa được đăng ký' });
        }

        const user = result.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

        await query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetToken, resetExpires, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"Fabric Calculator" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Đặt lại mật khẩu',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6fb;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" border="0"
                       style="background:#ffffff;border-radius:16px;overflow:hidden;
                              box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:500px;width:100%;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background:#6366f1;padding:28px 32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:20px;font-family:Arial,sans-serif;font-weight:700;">
                                Dat lai mat khau
                            </h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-family:Arial,sans-serif;">
                                Fabric Area Calculator
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 12px;color:#374151;font-size:15px;font-family:Arial,sans-serif;">
                                Xin chào <strong>${user.name}</strong>,
                            </p>
                            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                                Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục.
                                Link có hiệu lực trong <strong style="color:#6366f1;">1 giờ</strong>.
                            </p>

                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 28px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" bgcolor="#6366f1"
                                                    style="border-radius:8px;">
                                                    <a href="${resetUrl}" target="_blank"
                                                       style="display:inline-block;
                                                              padding:15px 40px;
                                                              background-color:#6366f1;
                                                              color:#ffffff;
                                                              font-size:15px;
                                                              font-weight:700;
                                                              font-family:Arial,sans-serif;
                                                              text-decoration:none;
                                                              border-radius:8px;
                                                              border:none;">
                                                        DAT LAI MAT KHAU
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-top:1px solid #e8eaf0;padding-top:20px;">
                                        <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">
                                            Nếu nút không hoạt động, copy link này vào trình duyệt:
                                        </p>
                                        <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;word-break:break-all;">
                                            <a href="${resetUrl}" style="color:#6366f1;">${resetUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e8eaf0;">
                            <p style="margin:0;color:#d1d5db;font-size:11px;font-family:Arial,sans-serif;">
                                Nếu bạn không yêu cầu, hãy bỏ qua email này. Hệ thống tự động, vui lòng không reply.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
        });

        res.json({ message: 'Nếu email tồn tại, link đặt lại đã được gửi' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Lỗi server, thử lại sau' });
    }
});

// ── POST /api/auth/reset-password ──────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ error: 'Thiếu token hoặc mật khẩu mới' });
        if (newPassword.length < 6)
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });

        const result = await query(
            `SELECT id FROM users 
             WHERE reset_token = $1 
               AND reset_token_expires > NOW() 
               AND is_active = true`,
            [token]
        );

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'Link đã hết hạn hoặc không hợp lệ' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query(
            `UPDATE users 
             SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
             WHERE id = $2`,
            [hashedPassword, result.rows[0].id]
        );

        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;