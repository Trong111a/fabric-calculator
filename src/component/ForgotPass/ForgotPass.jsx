import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/api';
import './ForgotPass.css';

function ForgotPass({ onNavigate }) {
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
            setErrorMsg(err.message || 'Gửi thất bại, thử lại sau');
        }
    };

    return (
        <div className="fp-wrap">
            <div className="fp-card">
                <button className="back" onClick={() => onNavigate('login')}>
                    <ArrowLeft size={20} /> Quay lại
                </button>

                <h2>Quên Mật Khẩu</h2>
                <p className="sub">Nhập email để nhận link đặt lại mật khẩu</p>

                {status === 'success' ? (
                    <div className="fp-success">
                        <CheckCircle size={40} color="#10b981" />
                        <p>Đã gửi link đặt lại mật khẩu!</p>
                        <p className="fp-success-sub">Kiểm tra hộp thư của <strong>{email}</strong><br />và làm theo hướng dẫn trong email.</p>
                        <button className="btn-primary" onClick={() => onNavigate('login')}>
                            Quay lại đăng nhập
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
                                placeholder="Email"
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
                                ? <><Loader size={16} className="fp-spin" /> Đang gửi...</>
                                : 'Gửi email'
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