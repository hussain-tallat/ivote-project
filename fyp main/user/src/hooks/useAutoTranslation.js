import { useState, useEffect } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import translationService from '../services/translationService';

// Custom hook that combines i18n with automatic translation
export const useAutoTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  const [isTranslating, setIsTranslating] = useState(false);

  // Get current language
  const currentLanguage = i18n.language || localStorage.getItem('language') || 'en';

  // Translate text automatically
  const translate = async (text) => {
    // If English or text is a translation key, use i18n
    if (currentLanguage === 'en' || text.startsWith('t:')) {
      return t(text.replace('t:', ''));
    }

    // For Urdu, use automatic translation
    if (currentLanguage === 'ur' && text && typeof text === 'string') {
      try {
        setIsTranslating(true);
        const translated = await translationService.translate(text, 'en', 'ur');
        return translated;
      } catch (error) {
        console.error('Translation error:', error);
        return text;
      } finally {
        setIsTranslating(false);
      }
    }

    return text;
  };

  // Change language
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return {
    t,
    translate,
    changeLanguage,
    currentLanguage,
    isTranslating,
    i18n
  };
};

export default useAutoTranslation;
