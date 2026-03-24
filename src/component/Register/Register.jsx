import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import './Register.css';
import { api } from '../../services/api'; 

function Register({ onNavigate }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);  

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async () => {  
        setError('');

        if (!form.name || !form.email || !form.password) {
            return setError('Vui lòng điền đầy đủ!');
        }
        if (form.password.length < 6) {
            return setError('Mật khẩu ≥ 6 ký tự!');
        }
        if (form.password !== form.confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp!');
        }

        setLoading(true);

        try {
            await api.register(form.name, form.email, form.password); 
            setSuccess(true);
            setTimeout(() => onNavigate('login'), 1500);
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reg-wrap">
            <div className="reg-card">
                <button className="back" onClick={() => onNavigate('login')}>
                    <ArrowLeft size={20} /> Quay lại
                </button>

                <h2>Đăng Ký</h2>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">Đăng ký thành công – đang chuyển...</div>}

                <div className="input-group">
                    <User size={18} />
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Họ tên"
                        disabled={loading || success}
                    />
                </div>

                <div className="input-group">
                    <Mail size={18} />
                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        disabled={loading || success}
                    />
                </div>

                <div className="input-group">
                    <Lock size={18} />
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Mật khẩu"
                        disabled={loading || success}
                    />
                </div>

                <div className="input-group">
                    <Lock size={18} />
                    <input
                        name="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Xác nhận mật khẩu"
                        onKeyPress={e => e.key === 'Enter' && handleRegister()}
                        disabled={loading || success}
                    />
                </div>

                <button
                    className="btn-primary"
                    onClick={handleRegister}
                    disabled={loading || success}
                >
                    {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
                </button>
            </div>
        </div>
    );
}

Register.propTypes = {
    onNavigate: PropTypes.func.isRequired,
};

export default Register;