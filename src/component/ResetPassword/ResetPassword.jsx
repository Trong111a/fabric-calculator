import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/api';
import './ResetPassword.css';

function ResetPassword({ onNavigate }) {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [status, setStatus] = useState('idle'); 
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) setToken(t);
        else setStatus('error'), setErrorMsg('Link không hợp lệ hoặc đã hết hạn');
    }, []);

    const handleReset = async () => {
        if (!password || !confirm) return;
        if (password.length < 6) {
            setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
            setStatus('error'); return;
        }
        if (password !== confirm) {
            setErrorMsg('Mật khẩu xác nhận không khớp');
            setStatus('error'); return;
        }
        setStatus('loading'); setErrorMsg('');
        try {
            await api.resetPassword(token, password);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Đặt lại thất bại, thử lại sau');
        }
    };

    return (
        <div className="rp-wrap">
            <div className="rp-card">
                <div className="rp-logo">
                    <Lock size={28} color="#fff" />
                </div>
                <h2 className="rp-title">Đặt mật khẩu mới</h2>

                {status === 'success' ? (
                    <div className="rp-success">
                        <CheckCircle size={48} color="#10b981" />
                        <p>Mật khẩu đã được đặt lại!</p>
                        <p className="rp-success-sub">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
                        <button className="rp-btn" onClick={() => onNavigate('login')}>
                            Đăng nhập ngay
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="rp-sub">Nhập mật khẩu mới cho tài khoản của bạn</p>

                        {status === 'error' && errorMsg && (
                            <div className="rp-error">
                                <AlertCircle size={15} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="rp-input-group">
                            <Lock size={17} className="rp-icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
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
                                placeholder="Xác nhận mật khẩu"
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
                                    <div key={i} className={`rp-strength-bar ${password.length >= i * 3 ? (password.length >= 10 ? 'strong' : 'medium') : ''
                                        }`} />
                                ))}
                                <span>{password.length < 6 ? 'Quá ngắn' : password.length < 10 ? 'Trung bình' : 'Mạnh'}</span>
                            </div>
                        )}

                        <button
                            className="rp-btn"
                            onClick={handleReset}
                            disabled={status === 'loading' || !token || !password || !confirm}
                        >
                            {status === 'loading'
                                ? <><Loader size={16} className="rp-spin" /> Đang xử lý...</>
                                : 'Đặt lại mật khẩu'
                            }
                        </button>

                        <button className="rp-back" onClick={() => onNavigate('login')}>
                            Quay lại đăng nhập
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

ResetPassword.propTypes = {
    onNavigate: PropTypes.func.isRequired,
};

export default ResetPassword;