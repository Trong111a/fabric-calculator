import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import './ForgotPass.css';

function ForgotPass({ onNavigate }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSend = async () => {
        if (!email.trim()) return;
        setStatus('loading');
        setErrorMsg('');
        try {
            await api.forgotPassword(email.trim());
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || t('reset_failed'));
        }
    };

    return (
        <div className="fp-wrap">
            <div className="fp-card">
                <button className="back" onClick={() => onNavigate('login')}>
                    <ArrowLeft size={20} /> {t('back_to_login')}
                </button>

                <h2>{t('forgot_title')}</h2>
                <p className="sub">{t('forgot_sub')}</p>

                {status === 'success' ? (
                    <div className="fp-success">
                        <CheckCircle size={40} color="#10b981" />
                        <p>{t('forgot_sent_title')}</p>
                        <p className="fp-success-sub"
                            dangerouslySetInnerHTML={{ __html: t('forgot_sent_sub', { email: `<strong>${email}</strong>` }) }}
                        />
                        <button className="btn-primary" onClick={() => onNavigate('login')}>
                            {t('back_to_login')}
                        </button>
                    </div>
                ) : (
                    <>
                        {status === 'error' && (
                            <div className="fp-error">
                                <AlertCircle size={16} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="input-group">
                            <Mail size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={t('email')}
                                disabled={status === 'loading'}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleSend}
                            disabled={status === 'loading' || !email.trim()}
                        >
                            {status === 'loading'
                                ? <><Loader size={16} className="fp-spin" /> {t('sending')}</>
                                : t('send_email')
                            }
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

ForgotPass.propTypes = {
    onNavigate: PropTypes.func.isRequired,
};

export default ForgotPass;