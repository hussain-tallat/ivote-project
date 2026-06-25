import React, { createContext, useContext, useState, useEffect } from 'react';
import translationService from '../services/translationService';

const TranslationContext = createContext();

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState({});

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  // Translate text dynamically
  const translateText = async (text, targetLang = null) => {
    const lang = targetLang || currentLanguage;

    // If already in target language or text is empty, return as is
    if (lang === 'en' || !text || text.trim() === '') {
      return text;
    }

    // Check if already translated
    const cacheKey = `${text}_${lang}`;
    if (translatedContent[cacheKey]) {
      return translatedContent[cacheKey];
    }

    try {
      setIsTranslating(true);
      const translated = await translationService.translate(text, 'en', lang);

      // Store in state
      setTranslatedContent(prev => ({
        ...prev,
        [cacheKey]: translated
      }));

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  // Change language
  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const value = {
    currentLanguage,
    isTranslating,
    translateText,
    changeLanguage,
    translatedContent
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationContext;
