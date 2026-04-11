import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Login.css';
import { api } from '../../services/api';
import logoHCMUTE from '../../assets/images/hcmute-logo.png';
import backgroundImg from '../../assets/images/login_picture.jpg';

function Login({ onLoginSuccess, onNavigate }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="login-root">
            <div className="login-bg" style={{

                backgroundImage: `url(${backgroundImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }} />
            {/* Left panel — brand */}
            <div className="login-brand">
                <div className="brand-overlay" />
                <div className="brand-content">
                    <div className="brand-logo-ring">
                        <img src={logoHCMUTE} alt="HCM-UTE Logo" className="brand-logo-img" />
                    </div>
                    <div className="brand-name-block">
                        <span className="brand-abbr">HCM·UTE</span>
                        <h1 className="brand-name-vi">Trường Đại học<br />Công nghệ Kỹ thuật<br />TP.HCM</h1>
                        <p className="brand-name-en">Ho Chi Minh City University<br />of Technology and Engineering</p>
                    </div>
                    <div className="brand-divider" />
                    <p className="brand-tagline">Hệ thống quản lý<br />đo diện tích vải</p>
                </div>
                <div className="brand-deco deco-1" />
                <div className="brand-deco deco-2" />
                <div className="brand-deco deco-3" />
            </div>

            {/* Right panel — form */}
            <div className="login-form-panel">
                <div className="login-card">
                    {/* Mobile logo */}
                    <div className="mobile-logo">
                        <img src={logoHCMUTE} alt="HCM-UTE" className="mobile-logo-img" />
                        <div>
                            <div className="mobile-abbr">HCM·UTE</div>
                            <div className="mobile-school-name">ĐH Công nghệ Kỹ thuật TP.HCM</div>
                        </div>
                    </div>

                    <div className="form-header">
                        <h2 className="form-title">{t('login')}</h2>
                        <p className="form-subtitle">Đăng nhập để tiếp tục sử dụng hệ thống</p>
                    </div>

                    {error && (
                        <div className="login-error">
                            <span className="error-dot" />
                            {error}
                        </div>
                    )}

                    <div className="field-group">
                        <label className="field-label">{t('email')}</label>
                        <div className={`field-wrap ${email ? 'has-value' : ''}`}>
                            <Mail size={16} className="field-icon" />
                            <input
                                type="email"
                                placeholder="example@hcmute.edu.vn"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={loading}
                                className="field-input"
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <label className="field-label">{t('password')}</label>
                        <div className={`field-wrap ${password ? 'has-value' : ''}`}>
                            <Lock size={16} className="field-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                disabled={loading}
                                className="field-input"
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <div className="forgot-row">
                        <button className="forgot-btn" onClick={() => onNavigate('forgot')}>
                            {t('forgot_password')}
                        </button>
                    </div>

                    <button
                        className={`login-btn ${loading ? 'is-loading' : ''}`}
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner" />
                        ) : (
                            <>
                                <span>{t('login')}</span>
                                <ArrowRight size={17} />
                            </>
                        )}
                    </button>

                    <div className="register-row">
                        <span>{t('no_account')}</span>
                        <button className="register-link" onClick={() => onNavigate('register')}>
                            {t('register')}
                        </button>
                    </div>
                </div>

                <p className="login-footer">
                    © {new Date().getFullYear()} HCM-UTE · Khoa Thời trang &amp; Du lịch
                </p>
            </div>
        </div>
    );
}

Login.propTypes = {
    onLoginSuccess: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
};

export default Login;