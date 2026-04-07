import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Thêm i18n
import './Login.css';
import { api } from '../../services/api';

function Login({ onLoginSuccess, onNavigate }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const data = await api.login(email, password);
            api.setToken(data.token);
            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message || t('login_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-card">
                <h2>{t('login')}</h2>
                {error && <div className="error">{error}</div>}

                <div className="input-group">
                    <Mail size={18} />
                    <input
                        type="email"
                        placeholder={t('email')}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="input-group">
                    <Lock size={18} />
                    <input
                        type="password"
                        placeholder={t('password')}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleLogin()}
                        disabled={loading}
                    />
                </div>

                <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                    {loading ? <span>{t('logging_in')}</span> : <span>{t('login')}</span>}
                </button>

                <div className="links">
                    <button onClick={() => onNavigate('forgot')}>{t('forgot_password')}</button>
                    <span>{t('no_account')} <b onClick={() => onNavigate('register')}>{t('register')}</b></span>
                </div>
            </div>
        </div>
    );
}

Login.propTypes = {
    onLoginSuccess: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
};

export default Login;