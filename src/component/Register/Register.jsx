import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { User, Mail, Lock, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Register.css';
import { api } from '../../services/api';
import logoHCMUTE from '../../assets/images/hcmute-logo.png';

function Register({ onNavigate }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async () => {
        setError('');
        if (!form.name || !form.email || !form.password) return setError(t('error_fill_all'));
        if (!emailRegex.test(form.email)) return setError(t('error_email_invalid'));
        if (form.password.length < 8) return setError(t('error_pw_short'));
        if (!strongRegex.test(form.password)) return setError(t('error_pw_complex'));
        if (form.password !== form.confirmPassword) return setError(t('error_pw_mismatch'));
        setLoading(true);
        try {
            await api.register(form.name, form.email, form.password);
            setSuccess(true);
            setTimeout(() => onNavigate('login'), 2000);
        } catch (err) {
            const code = err.code || 'UNKNOWN_ERROR';
            setError(t(`errors.${code}`, { defaultValue: 'Error' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rg-root">
            <div className="rg-brand">
                <div className="rg-brand-overlay" />
                <div className="rg-brand-content">
                    <div className="rg-brand-logo-ring">
                        <img src={logoHCMUTE} alt="HCM-UTE" className="rg-brand-logo-img" />
                    </div>
                    <div className="rg-brand-name-block">
                        <span className="rg-brand-abbr">HCM·UTE</span>
                        <h1 className="rg-brand-name-vi">TRƯỜNG ĐẠI HỌC<br />CÔNG NGHỆ KỸ THUẬT<br />THÀNH PHỐ HỒ CHÍ MINH</h1>
                        <p className="rg-brand-name-en">Ho Chi Minh City University<br />of Technology and Education</p>
                    </div>

                    <div className="rg-brand-unit-info">
                        <p className="rg-brand-faculty">{t('faculty')}</p>
                        <p className="brand-department">{t('major')}</p>
                    </div>

                    <div className="rg-brand-divider" />
                    <p className="rg-brand-tagline" dangerouslySetInnerHTML={{ __html: t('tagline') }} />
                </div>
                <div className="rg-brand-deco rg-deco-1" />
                <div className="rg-brand-deco rg-deco-2" />
                <div className="rg-brand-deco rg-deco-3" />
            </div>

            <div className="rg-form-panel">
                <div className="rg-mobile-logo">
                    <img src={logoHCMUTE} alt="HCM-UTE" className="rg-mobile-logo-img" />
                    <div>
                        <div className="rg-mobile-abbr">HCM·UTE</div>
                        <div className="rg-mobile-school-name">ĐH CÔNG NGHỆ KỸ THUẬT THÀNH PHỐ HỒ CHÍ MINH</div>

                        <div className="rg-mobile-unit">
                            <p>{t('faculty')}</p>
                            <p>{t('major')}</p>
                        </div>
                    </div>

                </div>

                <div className="rg-card">

                    <button className="rg-back-btn" onClick={() => onNavigate('login')}>
                        <ArrowLeft size={15} /> {t('back_to_login')}
                    </button>

                    {success ? (
                        <div className="rg-success-state">
                            <div className="rg-success-icon-wrap">
                                <CheckCircle size={36} />
                            </div>
                            <h2 className="rg-success-title">{t('register_success')}</h2>
                            <p className="rg-success-sub">{t('redirecting_login')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="rg-header">
                                <h2 className="rg-title">{t('register')}</h2>
                                <p className="rg-subtitle">{t('register_subtitle')}</p>
                            </div>

                            {error && (
                                <div className="rg-error">
                                    <span className="rg-error-dot" />{error}
                                </div>
                            )}

                            <div className="rg-field-group">
                                <label className="rg-field-label">{t('full_name')}</label>
                                <div className={`rg-field-wrap ${form.name ? 'has-value' : ''}`}>
                                    <User size={16} className="rg-field-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder={t('full_name_placeholder')}
                                        value={form.name}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="rg-field-input"
                                    />
                                </div>
                            </div>

                            <div className="rg-field-group">
                                <label className="rg-field-label">{t('email')}</label>
                                <div className={`rg-field-wrap ${form.email ? 'has-value' : ''}`}>
                                    <Mail size={16} className="rg-field-icon" />
                                    <input name="email" type="email" className="rg-field-input"
                                        placeholder="example@hcmute.edu.vn"
                                        onChange={handleChange} disabled={loading} />
                                </div>
                            </div>

                            <div className="rg-field-group">
                                <label className="rg-field-label">{t('password')}</label>
                                <div className={`rg-field-wrap ${form.password ? 'has-value' : ''}`}>
                                    <Lock size={16} className="rg-field-icon" />
                                    <input name="password" type={showPw ? 'text' : 'password'}
                                        className="rg-field-input" placeholder="••••••••"
                                        onChange={handleChange} disabled={loading}
                                        onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                                    <button type="button" className="rg-eye-btn"
                                        onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <div className="rg-field-group">
                                <label className="rg-field-label">{t('confirm_password')}</label>
                                <div className={`rg-field-wrap ${form.confirmPassword ? 'has-value' : ''}`}>
                                    <Lock size={16} className="rg-field-icon" />
                                    <input name="confirmPassword" type={showCf ? 'text' : 'password'}
                                        className="rg-field-input" placeholder="••••••••"
                                        onChange={handleChange} disabled={loading}
                                        onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                                    <button type="button" className="rg-eye-btn"
                                        onClick={() => setShowCf(v => !v)} tabIndex={-1}>
                                        {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <button className={`rg-submit-btn ${loading ? 'is-loading' : ''}`}
                                onClick={handleRegister} disabled={loading}>
                                {loading ? <span className="rg-spinner" /> : <><span>{t('register')}</span><ArrowRight size={17} /></>}
                            </button>

                            <div className="rg-login-row">
                                <span>{t('have_account')}</span>
                                <button className="rg-login-link" onClick={() => onNavigate('login')}>{t('login')}</button>
                            </div>
                        </>
                    )}
                </div>

                <p className="rg-footer">
                    © {new Date().getFullYear()} HCM-UTE · Khoa Thời trang &amp; Du lịch
                </p>
            </div>
        </div>
    );
}

Register.propTypes = { onNavigate: PropTypes.func.isRequired };
export default Register;