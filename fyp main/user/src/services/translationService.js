// Free Translation Service using MyMemory Translation API
// NO API KEY REQUIRED - Works immediately!
// Uses Google Translate backend
// Free tier: 1000 words per day

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.apiUrl = 'https://api.mymemory.translated.net/get';

    // Load cache from localStorage
    this.loadCacheFromStorage();
  }

  // Translate text from source language to target language
  async translate(text, sourceLang = 'en', targetLang = 'ur') {
    // Return original if same language or empty
    if (sourceLang === targetLang || !text || text.trim() === '') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.apiUrl}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200 || data.responseData) {
        const translatedText = data.responseData.translatedText;
        // Cache the translation
        this.cache.set(cacheKey, translatedText);
        this.saveCacheToStorage();
        return translatedText;
      } else {
        console.warn('Translation warning:', data.responseDetails || 'Unknown error');
        return text; // Return original text if translation fails
      }
    } catch (error) {
      console.error('Translation API error:', error);
      return text; // Return original text if API call fails
    }
  }

  // Translate multiple texts at once
  async translateBatch(texts, sourceLang = 'en', targetLang = 'ur') {
    const promises = texts.map(text => this.translate(text, sourceLang, targetLang));
    return Promise.all(promises);
  }

  // Save cache to localStorage for persistence
  saveCacheToStorage() {
    try {
      const cacheArray = Array.from(this.cache.entries());
      localStorage.setItem('translationCache', JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Error saving translation cache:', error);
    }
  }

  // Load cache from localStorage
  loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem('translationCache');
      if (cached) {
        const cacheArray = JSON.parse(cached);
        this.cache = new Map(cacheArray);
      }
    } catch (error) {
      console.error('Error loading translation cache:', error);
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    localStorage.removeItem('translationCache');
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
