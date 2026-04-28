import React, { useState, useEffect } from 'react';
import Login from './component/Login/Login';
import Register from './component/Register/Register';
import ForgotPass from './component/ForgotPass/ForgotPass';
import ResetPassword from './component/ResetPassword/ResetPassword';
import ViewMain from './component/ViewMain/ViewMain';
import FolderManager from './component/FolderManager/FolderManager';
import FolderDetail from './component/FolderDetail/FolderDetail';
import { api } from './services/api';

export default function App() {
  const [page, setPage] = useState(null);
  const [user, setUser] = useState(null);
  const [openedFolder, setOpenedFolder] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/reset-password' && params.get('token')) {
      setPage('reset-password');
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      api.getMe()
        .then(data => {
          setUser(data.user);
          if (path === '/folders') {
            setPage('folders');
          } else if (path.startsWith('/folders/')) {
            const folderId = path.split('/folders/')[1];
            api.getFolder(folderId)
              .then(folderData => {
                setOpenedFolder(folderData);
                setPage('folder-detail');
              })
              .catch(() => {
                setPage('folders');
                window.history.replaceState({}, '', '/folders');
              });
          } else {
            setPage('main');
          }
        })
        .catch(() => {
          api.clearToken();
          setPage('login');
          window.history.replaceState({}, '', '/');
        });
    } else {
      if (path === '/register') setPage('register');
      else if (path === '/forgot') setPage('forgot');
      else setPage('login');
    }
  }, []);

  const nav = (p, data = null) => {
    const routes = {
      login: '/',
      register: '/register',
      forgot: '/forgot',
      main: '/app',
      folders: '/folders',
      'reset-password': '/reset-password',
    };
    window.history.pushState({}, '', routes[p] || '/');
    if (data) setOpenedFolder(data);
    setPage(p);
  };

  const loginSuccess = (u) => {
    setUser(u);
    window.history.pushState({}, '', '/app');
    setPage('main');
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setOpenedFolder(null);
    window.history.pushState({}, '', '/');
    setPage('login');
  };

  const openFolder = (folder) => {
    window.history.pushState({}, '', `/folders/${folder.id}`);
    setOpenedFolder(folder);
    setPage('folder-detail');
  };

  const closeFolder = () => {
    window.history.pushState({}, '', '/folders');
    setOpenedFolder(null);
    setPage('folders');
  };

  const closeFolders = () => {
    window.history.pushState({}, '', '/app');
    setPage('main');
  };

  if (page === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e0e4ef', borderTop: '3px solid #0066B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Đang tải...</p>
      </div>
    </div>
  );

  if (page === 'login') return <Login onLoginSuccess={loginSuccess} onNavigate={nav} />;
  if (page === 'register') return <Register onNavigate={nav} />;
  if (page === 'forgot') return <ForgotPass onNavigate={nav} />;
  if (page === 'reset-password') return <ResetPassword onNavigate={nav} />;
  if (page === 'main') return <ViewMain user={user} onLogout={logout} onOpenFolders={() => nav('folders')} />;
  if (page === 'folders') return <FolderManager onBack={closeFolders} onOpenFolder={openFolder} />;
  if (page === 'folder-detail') return <FolderDetail folder={openedFolder} onBack={closeFolder} />;
  return null;
}