import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Lock } from 'lucide-react';
import './Login.css';
import { api } from '../../services/api';  

function Login({ onLoginSuccess, onNavigate }) {
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
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-card">
                <h2>Đăng Nhập</h2>
                {error && <div className="error">{error}</div>}

                <div className="input-group">
                    <Mail size={18} />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="input-group">
                    <Lock size={18} />
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleLogin()}
                        disabled={loading}
                    />
                </div>

                <button
                    className="btn-primary"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </button>

                <div className="links">
                    <button onClick={() => onNavigate('forgot')}>Quên mật khẩu?</button>
                    <span>Chưa có tài khoản? <b onClick={() => onNavigate('register')}>Đăng ký</b></span>
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