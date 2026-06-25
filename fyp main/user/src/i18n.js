import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

import translationEN from './locales/en/translation.json';
import translationUR from './locales/ur/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  ur: {
    translation: translationUR
  }
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }
  });

// Ensure language is saved and applied
if (savedLanguage) {
  i18n.changeLanguage(savedLanguage);
}

export default i18n;
