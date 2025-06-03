'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
    en: {
        translation: {
            // ImageMetadataPanel translations
            'metadata.title': 'Image info',
            'metadata.dateTaken': 'Date Taken',
            'metadata.tags': 'Tags',
            'metadata.description': 'Description',
            'metadata.save': 'Save',
            'metadata.saving': 'Saving...',
            'metadata.size': 'Size',
            'metadata.dimensions': 'Dimensions',
            'metadata.type': 'Type',
            'metadata.updated': 'Updated',
            'metadata.precision': '{{precision}} precision',
            'metadata.rotateLeft': 'Rotate left (90° counter-clockwise)',
            'metadata.rotateRight': 'Rotate right (90° clockwise)',

            // TagsInput translations
            'tags.addNew': 'Add new tag',

            // DatePicker translations
            'date.year': 'Year',
            'date.month': 'Month',
            'date.day': 'Day',
            'date.months.january': 'January',
            'date.months.february': 'February',
            'date.months.march': 'March',
            'date.months.april': 'April',
            'date.months.may': 'May',
            'date.months.june': 'June',
            'date.months.july': 'July',
            'date.months.august': 'August',
            'date.months.september': 'September',
            'date.months.october': 'October',
            'date.months.november': 'November',
            'date.months.december': 'December',

            // File size units
            'units.kb': 'KB',
            'units.mb': 'MB',
            'units.gb': 'GB',
        }
    },
    uk: {
        translation: {
            // ImageMetadataPanel translations
            'metadata.title': 'Інформація про фото',
            'metadata.dateTaken': 'Дата зйомки',
            'metadata.tags': 'Теги',
            'metadata.description': 'Опис',
            'metadata.save': 'Зберегти',
            'metadata.saving': 'Збереження...',
            'metadata.size': 'Розмір',
            'metadata.dimensions': 'Розміри',
            'metadata.type': 'Тип',
            'metadata.updated': 'Оновлено',
            'metadata.precision': 'точність {{precision}}',
            'metadata.rotateLeft': 'Повернути ліворуч (90° проти годинникової стрілки)',
            'metadata.rotateRight': 'Повернути праворуч (90° за годинниковою стрілкою)',

            // TagsInput translations
            'tags.addNew': 'Додати новий тег',

            // DatePicker translations
            'date.year': 'Рік',
            'date.month': 'Місяць',
            'date.day': 'День',
            'date.months.january': 'Січень',
            'date.months.february': 'Лютий',
            'date.months.march': 'Березень',
            'date.months.april': 'Квітень',
            'date.months.may': 'Травень',
            'date.months.june': 'Червень',
            'date.months.july': 'Липень',
            'date.months.august': 'Серпень',
            'date.months.september': 'Вересень',
            'date.months.october': 'Жовтень',
            'date.months.november': 'Листопад',
            'date.months.december': 'Грудень',

            // File size units
            'units.kb': 'КБ',
            'units.mb': 'МБ',
            'units.gb': 'ГБ',
        }
    }
};

// Create context for i18n initialization status
const I18nContext = createContext<{ isReady: boolean }>({ isReady: false });

export const useI18nReady = () => useContext(I18nContext);

interface I18nProviderProps {
    children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Initialize i18n only on client side
        if (!i18n.isInitialized) {
            i18n
                .use(LanguageDetector)
                .use(initReactI18next)
                .init({
                    resources,
                    lng: 'en', // default language
                    fallbackLng: 'en',

                    interpolation: {
                        escapeValue: false, // React already escapes by default
                    },

                    // Configure language detection
                    detection: {
                        order: ['localStorage', 'navigator', 'htmlTag'],
                        caches: ['localStorage'],
                        lookupLocalStorage: 'i18nextLng',
                    },
                })
                .then(() => {
                    setIsReady(true);
                });
        } else {
            setIsReady(true);
        }
    }, []);

    return (
        <I18nContext.Provider value={{ isReady }}>
            {children}
        </I18nContext.Provider>
    );
} 