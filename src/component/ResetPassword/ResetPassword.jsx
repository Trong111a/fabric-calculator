import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import './ResetPassword.css';
import logoHCMUTE from '../../assets/images/hcmute-logo.png';

function ResetPassword({ onNavigate }) {
    const { t } = useTranslation();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tk = params.get('token');
        if (tk) setToken(tk);
        else { setStatus('error'); setErrorMsg(t('link_invalid')); }
    }, [t]);

    const handleReset = async () => {
        if (!password || !confirm) return;
        if (password.length < 6) { setErrorMsg(t('error_pw_short')); setStatus('error'); return; }
        if (password !== confirm) { setErrorMsg(t('error_pw_mismatch')); setStatus('error'); return; }
        setStatus('loading'); setErrorMsg('');
        try {
            await api.resetPassword(token, password);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || t('reset_failed'));
        }
    };

    const strengthLevel = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthLabel = ['', t('pw_too_short'), t('pw_medium'), t('pw_strong')][strengthLevel];
    const strengthClass = ['', 'weak', 'medium', 'strong'][strengthLevel];

    return (
        <div className="rsp-root">
            <div className="rsp-brand">
                <div className="rsp-brand-overlay" />
                <div className="rsp-brand-content">
                    <div className="rsp-brand-logo-ring">
                        <img src={logoHCMUTE} alt="HCM-UTE" className="rsp-brand-logo-img" />
                    </div>
                    <div className="rsp-brand-name-block">
                        <span className="rsp-brand-abbr">HCM·UTE</span>
                        <h1 className="rsp-brand-name-vi">TRƯỜNG ĐẠI HỌC<br />CÔNG NGHỆ KỸ THUẬT<br />TP.HCM</h1>
                        <p className="rsp-brand-name-en">Ho Chi Minh City University<br />of Technology and Education</p>
                    </div>

                     <div className="rsp-brand-unit-info">
                        <p className="rsp-brand-faculty">KHOA THỜI TRANG VÀ DU LỊCH</p>
                        <p className="rsp-brand-department">BỘ MÔN CÔNG NGHỆ MAY</p>
                    </div> 

                    <div className="rsp-brand-divider" />
                    <p className="rsp-brand-tagline">Hệ thống quản lý<br />đo diện tích vải</p>
                </div>
                <div className="rsp-brand-deco rsp-deco-1" />
                <div className="rsp-brand-deco rsp-deco-2" />
                <div className="rsp-brand-deco rsp-deco-3" />
            </div>

            <div className="rsp-form-panel">
                <div className="rsp-card">
                    <div className="rsp-mobile-logo">
                        <img src={logoHCMUTE} alt="HCM-UTE" className="rsp-mobile-logo-img" />
                        <div>
                            <div className="rsp-mobile-abbr">HCM·UTE</div>
                            <div className="rsp-mobile-school-name">ĐH CÔNG NGHỆ KỸ THUẬT TP.HCM</div>
                        </div>

                         <div className="rsp-mobile-unit">
                            <p>KHOA THỜI TRANG VÀ DU LỊCH</p>
                            <p>BỘ MÔN CÔNG NGHỆ MAY</p>
                        </div>  

                    </div>

                    <button className="rsp-back-btn" onClick={() => onNavigate('login')}>
                        <ArrowLeft size={15} /> {t('back_to_login')}
                    </button>

                    {status === 'success' ? (
                        <div className="rsp-success-state">
                            <div className="rsp-success-icon-wrap">
                                <CheckCircle size={36} />
                            </div>
                            <h2 className="rsp-success-title">{t('reset_success_title')}</h2>
                            <p className="rsp-success-sub">{t('reset_success_sub')}</p>
                            <button className="rsp-submit-btn" onClick={() => onNavigate('login')}>
                                {t('login_now')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="rsp-form-header">
                                <div className="rsp-icon-wrap">
                                    <ShieldCheck size={22} />
                                </div>
                                <h2 className="rsp-title">{t('reset_title')}</h2>
                                <p className="rsp-subtitle">{t('reset_sub')}</p>
                            </div>

                            {status === 'error' && errorMsg && (
                                <div className="rsp-error">
                                    <AlertCircle size={15} /><span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="rsp-field-group">
                                <label className="rsp-field-label">{t('new_password_placeholder')}</label>
                                <div className={`rsp-field-wrap ${password ? 'has-value' : ''}`}>
                                    <Lock size={16} className="rsp-field-icon" />
                                    <input type={showPw ? 'text' : 'password'} className="rsp-field-input"
                                        placeholder="••••••••" value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        disabled={status === 'loading' || !token}
                                        onKeyDown={e => e.key === 'Enter' && handleReset()} />
                                    <button type="button" className="rsp-eye-btn"
                                        onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {password && (
                                    <div className="rsp-strength">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`rsp-strength-bar ${i <= strengthLevel ? strengthClass : ''}`} />
                                        ))}
                                        <span className={`rsp-strength-label ${strengthClass}`}>{strengthLabel}</span>
                                    </div>
                                )}
                            </div>

                            <div className="rsp-field-group">
                                <label className="rsp-field-label">{t('confirm_password_placeholder')}</label>
                                <div className={`rsp-field-wrap ${confirm ? 'has-value' : ''}`}>
                                    <Lock size={16} className="rsp-field-icon" />
                                    <input type={showCf ? 'text' : 'password'} className="rsp-field-input"
                                        placeholder="••••••••" value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        disabled={status === 'loading' || !token}
                                        onKeyDown={e => e.key === 'Enter' && handleReset()} />
                                    <button type="button" className="rsp-eye-btn"
                                        onClick={() => setShowCf(v => !v)} tabIndex={-1}>
                                        {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <button className={`rsp-submit-btn ${status === 'loading' ? 'is-loading' : ''}`}
                                onClick={handleReset}
                                disabled={status === 'loading' || !token || !password || !confirm}>
                                {status === 'loading'
                                    ? <span className="rsp-spinner" />
                                    : <><ShieldCheck size={16} /><span>{t('reset_btn')}</span></>
                                }
                            </button>
                        </>
                    )}
                </div>

                <p className="rsp-footer">
                    © {new Date().getFullYear()} HCM-UTE · Khoa Thời trang &amp; Du lịch
                </p>
            </div>
        </div>
    );
}

ResetPassword.propTypes = { onNavigate: PropTypes.func.isRequired };
export default ResetPassword;