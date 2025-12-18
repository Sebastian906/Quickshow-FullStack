import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        // Obtener idioma guardado en localStorage o usar inglés por defecto
        return localStorage.getItem('language') || 'en';
    });

    useEffect(() => {
        // Guardar idioma en localStorage cuando cambie
        localStorage.setItem('language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'en' ? 'es' : 'en');
    };

    const changeLanguage = (lang) => {
        if (lang === 'en' || lang === 'es') {
            setLanguage(lang);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};