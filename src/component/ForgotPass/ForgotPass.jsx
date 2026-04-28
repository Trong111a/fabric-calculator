import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import './ForgotPass.css';
import logoHCMUTE from '../../assets/images/hcmute-logo.png';

function ForgotPass({ onNavigate }) {
    const { t, i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [emailError, setEmailError] = useState('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    const handleSend = async () => {
        if (!email.trim()) return;
        if (!emailRegex.test(email.trim())) {
            setEmailError(t('error_email_invalid'));
            return;
        }
        setEmailError('');
        setStatus('loading');
        setErrorMsg('');
        try {
           await api.forgotPassword(email.trim(), i18n.language);
            setStatus('success');
        } catch (err) {
            const code = err.code || 'UNKNOWN_ERROR';
            setErrorMsg(t(`errors.${code}`, { defaultValue: t('reset_failed') }));
            setStatus('error');
        }
    };

    return (
        <div className="fp-root">
            <div className="fp-brand">
                <div className="fp-brand-overlay" />
                <div className="fp-brand-content">
                    <div className="fp-brand-logo-ring">
                        <img src={logoHCMUTE} alt="HCM-UTE" className="fp-brand-logo-img" />
                    </div>
                    <div className="fp-brand-name-block">
                        <span className="fp-brand-abbr">HCM·UTE</span>
                        <h1 className="fp-brand-name-vi">TRƯỜNG ĐẠI HỌC<br />CÔNG NGHỆ KỸ THUẬT<br />THÀNH PHỐ HỒ CHÍ MINH</h1>
                        <p className="fp-brand-name-en">Ho Chi Minh City University<br />of Technology and Education</p>
                    </div>

                    <div className="fp-brand-unit-info">
                        <p className="fp-brand-faculty">{t('faculty')}</p>
                        <p className="fp-brand-department">{t('major')}</p>
                    </div>
                    <div className="fp-brand-divider" />
                    <p className="fp-brand-tagline" dangerouslySetInnerHTML={{ __html: t('tagline') }} />

                </div>
                <div className="fp-brand-deco fp-deco-1" />
                <div className="fp-brand-deco fp-deco-2" />
                <div className="fp-brand-deco fp-deco-3" />
            </div>

            <div className="fp-form-panel">
                <div className="fp-mobile-logo">
                    <img src={logoHCMUTE} alt="HCM-UTE" className="fp-mobile-logo-img" />
                    <div>
                        <div className="fp-mobile-abbr">HCM·UTE</div>
                        <div className="fp-mobile-school-name">ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT THÀNH PHỐ HỒ CHÍ MINH</div>


                        <div className="fp-mobile-unit">
                            <p>{t('faculty')}</p>
                            <p>{t('major')}</p>
                        </div>
                    </div>

                </div>
                <div className="fp-card">
                    <button className="fp-back-btn" onClick={() => onNavigate('login')}>
                        <ArrowLeft size={15} /> {t('back_to_login')}
                    </button>

                    {status === 'success' ? (
                        <div className="fp-success-state">
                            <div className="fp-success-icon-wrap">
                                <CheckCircle size={36} />
                            </div>
                            <h2 className="fp-success-title">{t('forgot_sent_title')}</h2>
                            <p className="fp-success-sub"
                                dangerouslySetInnerHTML={{ __html: t('forgot_sent_sub', { email: `<strong>${email}</strong>` }) }}
                            />
                            <button className="fp-submit-btn" onClick={() => onNavigate('login')}>
                                {t('back_to_login')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="fp-form-header">
                                <div className="fp-icon-wrap">
                                    <Mail size={22} />
                                </div>
                                <h2 className="fp-title">{t('forgot_title')}</h2>
                                <p className="fp-subtitle">{t('forgot_sub')}</p>
                            </div>

                            {status === 'error' && errorMsg && (
                                <div className="fp-error">
                                    <AlertCircle size={15} /><span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="fp-field-group">
                                <label className="fp-field-label">{t('email')}</label>
                                <div className={`fp-field-wrap ${email ? 'has-value' : ''} ${emailError ? 'has-error' : ''}`}>
                                    <Mail size={16} className="fp-field-icon" />
                                    <input
                                        type="email"
                                        className="fp-field-input"
                                        placeholder="example@hcmute.edu.vn"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                                        disabled={status === 'loading'}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    />
                                </div>
                                {emailError && (
                                    <div className="fp-field-error">{emailError}</div>
                                )}
                            </div>

                            <button
                                className={`fp-submit-btn ${status === 'loading' ? 'is-loading' : ''}`}
                                onClick={handleSend}
                                disabled={status === 'loading' || !email.trim()}
                            >
                                {status === 'loading'
                                    ? <span className="fp-spinner" />
                                    : <><Send size={15} /><span>{t('send_email')}</span></>
                                }
                            </button>
                        </>
                    )}
                </div>

                <p className="fp-footer">
                    © {new Date().getFullYear()} HCM-UTE · Khoa Thời trang &amp; Du lịch
                </p>
            </div>
        </div>
    );
}

ForgotPass.propTypes = { onNavigate: PropTypes.func.isRequired };
export default ForgotPass;