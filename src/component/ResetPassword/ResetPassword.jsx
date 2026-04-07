import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import './ResetPassword.css';

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

    const strengthLabel = password.length < 6 ? t('pw_too_short') : password.length < 10 ? t('pw_medium') : t('pw_strong');
    const strengthClass = password.length < 6 ? '' : password.length < 10 ? 'medium' : 'strong';

    return (
        <div className="rp-wrap">
            <div className="rp-card">
                <div className="rp-logo"><Lock size={28} color="#fff" /></div>
                <h2 className="rp-title">{t('reset_title')}</h2>

                {status === 'success' ? (
                    <div className="rp-success">
                        <CheckCircle size={48} color="#10b981" />
                        <p>{t('reset_success_title')}</p>
                        <p className="rp-success-sub">{t('reset_success_sub')}</p>
                        <button className="rp-btn" onClick={() => onNavigate('login')}>
                            {t('login_now')}
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="rp-sub">{t('reset_sub')}</p>

                        {status === 'error' && errorMsg && (
                            <div className="rp-error">
                                <AlertCircle size={15} /><span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="rp-input-group">
                            <Lock size={17} className="rp-icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder={t('new_password_placeholder')}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={status === 'loading' || !token}
                                onKeyDown={e => e.key === 'Enter' && handleReset()}
                            />
                            <button className="rp-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className="rp-input-group">
                            <Lock size={17} className="rp-icon" />
                            <input
                                type={showCf ? 'text' : 'password'}
                                placeholder={t('confirm_password_placeholder')}
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                disabled={status === 'loading' || !token}
                                onKeyDown={e => e.key === 'Enter' && handleReset()}
                            />
                            <button className="rp-eye" onClick={() => setShowCf(v => !v)} tabIndex={-1}>
                                {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {password && (
                            <div className="rp-strength">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`rp-strength-bar ${password.length >= i * 3 ? strengthClass : ''}`} />
                                ))}
                                <span>{strengthLabel}</span>
                            </div>
                        )}

                        <button
                            className="rp-btn"
                            onClick={handleReset}
                            disabled={status === 'loading' || !token || !password || !confirm}
                        >
                            {status === 'loading'
                                ? <><Loader size={16} className="rp-spin" /> {t('resetting')}</>
                                : t('reset_btn')
                            }
                        </button>

                        <button className="rp-back" onClick={() => onNavigate('login')}>
                            {t('back_to_login')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

ResetPassword.propTypes = { onNavigate: PropTypes.func.isRequired };
export default ResetPassword;