const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name)
            return res.status(400).json({ code: 'MISSING_DATA' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ code: 'EMAIL_INVALID' });

        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!strongRegex.test(password))
            return res.status(400).json({ code: 'PASSWORD_WEAK' });

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
            return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (result.rows.length === 0)
            return res.status(401).json({ code: 'INVALID_CREDENTIALS' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch)
            return res.status(401).json({ code: 'INVALID_CREDENTIALS' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        res.json({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token
        });
    } catch (err) {
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.get('/me', auth, (req, res) => {
    res.json({ user: req.user });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ code: 'MISSING_EMAIL' });

        const result = await query(
            'SELECT id, name FROM users WHERE email = $1 AND is_active = true',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.json({ code: 'RESET_EMAIL_SENT' });
        }

        const user = result.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

        await query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetToken, resetExpires, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await sgMail.send({
            from: `"PATECH" <${process.env.EMAIL_USER}>`,
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
                                Đặt lại mật khẩu
                            </h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-family:Arial,sans-serif;">
                                PATECH
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
                                                        ĐẶT LẠI MẬT KHẨU
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

        res.json({ code: 'RESET_EMAIL_SENT' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ code: 'MISSING_DATA' });
        if (newPassword.length < 8)
            return res.status(400).json({ code: 'PASSWORD_TOO_SHORT' });

        const result = await query(
            `SELECT id FROM users 
             WHERE reset_token = $1 
               AND reset_token_expires > NOW() 
               AND is_active = true`,
            [token]
        );

        if (result.rows.length === 0)
            return res.status(400).json({ code: 'TOKEN_INVALID_OR_EXPIRED' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query(
            `UPDATE users 
             SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
             WHERE id = $2`,
            [hashedPassword, result.rows[0].id]
        );

        res.json({ code: 'RESET_SUCCESS' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ code: 'SERVER_ERROR' });
    }
});

module.exports = router;