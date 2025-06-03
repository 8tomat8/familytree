'use client';

import { useState, useEffect } from 'react';
import { useI18nReady } from './I18nProvider';
import i18n from 'i18next';

export function LanguageSwitcher() {
    const { isReady } = useI18nReady();
    const [currentLang, setCurrentLang] = useState('en');

    // Update current language when i18n is ready or language changes
    useEffect(() => {
        if (isReady && i18n.isInitialized) {
            setCurrentLang(i18n.language || 'en');

            // Listen for language changes
            const handleLanguageChange = (lng: string) => {
                setCurrentLang(lng);
            };

            i18n.on('languageChanged', handleLanguageChange);

            return () => {
                i18n.off('languageChanged', handleLanguageChange);
            };
        }
    }, [isReady]);

    const toggleLanguage = () => {
        if (isReady && i18n.isInitialized && i18n.changeLanguage) {
            const newLang = currentLang === 'en' ? 'uk' : 'en';
            i18n.changeLanguage(newLang);
        }
    };

    // Show loading state while i18n is initializing
    if (!isReady) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span className="text-lg">🌐</span>
                <span className="text-sm font-medium">...</span>
            </div>
        );
    }

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            title={`Switch to ${currentLang === 'en' ? 'Ukrainian' : 'English'}`}
        >
            <span className="text-lg">
                {currentLang === 'en' ? '🇺🇦' : '🇬🇧'}
            </span>
        </button>
    );
} 