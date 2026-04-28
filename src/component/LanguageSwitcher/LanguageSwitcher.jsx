import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang.startsWith('vi') ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
        localStorage.setItem('i18nextLng', newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="lang-switch-btn"
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                fontSize: '14px',
                fontWeight: '500'
            }}
        >
            <Languages size={16} />
            <span>{i18n.language.startsWith('vi') ? 'English' : 'Tiếng Việt'}</span>
        </button>
    );
};

export default LanguageSwitcher;