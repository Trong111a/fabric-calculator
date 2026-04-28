import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Login.css';
import { api } from '../../services/api';
import logoHCMUTE from '../../assets/images/hcmute-logo.png';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';

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
            const code = err.code || 'UNKNOWN_ERROR';
            setError(t(`errors.${code}`, { defaultValue: t('login_failed') }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-root">
            <LanguageSwitcher />
            {/* Left panel — brand */}
            <div className="login-brand">
                <div className="brand-overlay" />
                <div className="brand-content">
                    <div className="brand-logo-ring">
                        <img src={logoHCMUTE} alt="HCM-UTE Logo" className="brand-logo-img" />
                    </div>
                    <div className="brand-name-block">
                        <span className="brand-abbr">HCM·UTE</span>
                        <h1 className="brand-name-vi">TRƯỜNG ĐẠI HỌC<br />CÔNG NGHỆ KỸ THUẬT<br />THÀNH PHỐ HỒ CHÍ MINH</h1>
                        <p className="brand-name-en">Ho Chi Minh City University<br />of Technology and Engineering</p>
                    </div>

                    <div className="brand-unit-info">
                        <p className="brand-faculty">{t('faculty')}</p>
                        <p className="brand-department">{t('major')}</p>
                    </div>

                    <div className="brand-divider" />
                    <p
                        className="brand-tagline"
                        dangerouslySetInnerHTML={{ __html: t('tagline') }}
                    />
                </div>
                <div className="brand-deco deco-1" />
                <div className="brand-deco deco-2" />
                <div className="brand-deco deco-3" />
            </div>

            {/* Right panel — form */}
            <div className="login-form-panel">
                {/* Mobile logo */}
                <div className="mobile-logo">
                    <img src={logoHCMUTE} alt="HCM-UTE" className="mobile-logo-img" />
                    <div>
                        <div className="mobile-abbr">HCM·UTE</div>
                        <div className="mobile-school-name">ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT THÀNH PHỐ HỒ CHÍ MINH</div>
                        <div className="mobile-unit">
                            <p>{t('faculty')}</p>
                            <p>{t('major')}</p>
                        </div>
                    </div>


                </div>

                <div className="login-card">

                    <div className="form-header">
                        <h2 className="form-title">{t('login')}</h2>
                        <p className="form-subtitle">{t('login_subtitle')}</p>
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

                <div className="login-about">
                    <div className="about-divider" />
                    <p
                        className="about-product"
                        dangerouslySetInnerHTML={{ __html: t('about_folder') }}
                    />

                    <p
                        className="about-desc"
                        dangerouslySetInnerHTML={{ __html: t('about_desc') }}
                    />
                    <div className="about-contacts">
                        <div className="about-group">
                            <span className="about-group-label">{t('about_students')}</span>
                            <a href="mailto:vyvy30032004@gmail.com" className="about-contact-item">
                                Lê Trần Thúy Vy · vyvy30032004@gmail.com
                            </a>
                            <a href="mailto:tranthu221004@gmail.com" className="about-contact-item">
                                Trần Minh Thư · tranthu221004@gmail.com
                            </a>
                        </div>
                        <div className="about-group">
                            <span className="about-group-label">{t('about_supervisor')}</span>
                            <a href="mailto:thucoanh@hcmute.edu.vn" className="about-contact-item">
                                ThS Tạ Vũ Thục Oanh · thucoanh@hcmute.edu.vn
                            </a>
                        </div>
                        <div className="about-group">
                            <span className="about-group-label">{t('about_support')}</span>
                            <a href="mailto:nguyenvantrong3254@gmail.com" className="about-contact-item">
                                Nguyễn Văn Trọng · nguyenvantrong3254@gmail.com
                            </a>
                        </div>
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