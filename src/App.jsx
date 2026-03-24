import React, { useState, useEffect } from 'react';
import Login from './component/Login/Login';
import Register from './component/Register/Register';
import ForgotPass from './component/ForgotPass/ForgotPass';
import ResetPassword from './component/ResetPassword/ResetPassword';
import ViewMain from './component/ViewMain/ViewMain';

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);

  // Kiểm tra URL khi app khởi động
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/reset-password' && params.get('token')) {
      setPage('reset-password');
    }
  }, []);

  const loginSuccess = (u) => { setUser(u); setPage('main'); };
  const logout = () => { setUser(null); setPage('login'); };

  const nav = (p) => {
    if (page === 'reset-password') {
      window.history.pushState({}, '', '/');
    }
    setPage(p);
  };

  if (page === 'login') return <Login onLoginSuccess={loginSuccess} onNavigate={nav} />;
  if (page === 'register') return <Register onNavigate={nav} />;
  if (page === 'forgot') return <ForgotPass onNavigate={nav} />;
  if (page === 'reset-password') return <ResetPassword onNavigate={nav} />;
  if (page === 'main') return <ViewMain user={user} onLogout={logout} />;
  return null;
}