import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { User, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Register.css';
import { api } from '../../services/api';

function Register({ onNavigate }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async () => {
        setError('');
        if (!form.name || !form.email || !form.password) return setError(t('error_fill_all'));
        if (form.password.length < 6) return setError(t('error_pw_short'));
        if (form.password !== form.confirmPassword) return setError(t('error_pw_mismatch'));

        setLoading(true);
        try {
            await api.register(form.name, form.email, form.password);
            setSuccess(true);
            setTimeout(() => onNavigate('login'), 1500);
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reg-wrap">
            <div className="reg-card">
                <h2>{t('register')}</h2>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{t('register_success')}</div>}

                <div className="input-group">
                    <User size={18} /><input name="name" placeholder="Name" onChange={handleChange} disabled={loading || success} />
                </div>
                <div className="input-group">
                    <Mail size={18} /><input name="email" placeholder={t('email')} onChange={handleChange} disabled={loading || success} />
                </div>
                <div className="input-group">
                    <Lock size={18} /><input name="password" type="password" placeholder={t('password')} onChange={handleChange} disabled={loading || success} />
                </div>
                <div className="input-group">
                    <Lock size={18} /><input name="confirmPassword" type="password" placeholder={t('confirm_password')} onChange={handleChange} disabled={loading || success} />
                </div>

                <button className="btn-primary" onClick={handleRegister} disabled={loading || success}>
                    {loading ? <span>{t('registering')}</span> : <span>{t('register')}</span>}
                </button>
                <div className="links">
                     <span>{t('have_account')} <b onClick={() => onNavigate('login')}>{t('login')}</b></span>
                </div>
            </div>
        </div>
    );
}

Register.propTypes = { onNavigate: PropTypes.func.isRequired };
export default Register;