/**
 * useLocale Hook
 * 
 * Custom hook for locale-related utilities.
 * Provides easy access to translation functions and language switching.
 */

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { supportedLanguages, changeLanguage, getCurrentLanguage } from '../services/i18n';

/**
 * Custom hook for localization utilities
 * @param {string|string[]} namespace - Translation namespace(s) to use
 * @returns {object} Localization utilities
 */
export const useLocale = (namespace = 'common') => {
  const { t, i18n } = useTranslation(namespace);

  /**
   * Get the current language code
   */
  const currentLanguage = getCurrentLanguage();

  /**
   * Get the current language object with name and flag
   */
  const currentLanguageInfo = supportedLanguages.find(
    lang => lang.code === currentLanguage
  ) || supportedLanguages[0];

  /**
   * Switch to a different language
   */
  const switchLanguage = useCallback((languageCode) => {
    changeLanguage(languageCode);
  }, []);

  /**
   * Toggle between available languages (useful for 2-language setups)
   */
  const toggleLanguage = useCallback(() => {
    const currentIndex = supportedLanguages.findIndex(
      lang => lang.code === currentLanguage
    );
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    changeLanguage(supportedLanguages[nextIndex].code);
  }, [currentLanguage]);

  /**
   * Format a number according to current locale
   */
  const formatNumber = useCallback((number, options = {}) => {
    return new Intl.NumberFormat(currentLanguage, options).format(number);
  }, [currentLanguage]);

  /**
   * Format currency according to current locale
   */
  const formatCurrency = useCallback((amount, currency = 'EUR') => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
    }).format(amount);
  }, [currentLanguage]);

  /**
   * Format a date according to current locale
   */
  const formatDate = useCallback((date, options = {}) => {
    return new Intl.DateTimeFormat(currentLanguage, options).format(new Date(date));
  }, [currentLanguage]);

  return {
    t,
    i18n,
    currentLanguage,
    currentLanguageInfo,
    supportedLanguages,
    switchLanguage,
    toggleLanguage,
    formatNumber,
    formatCurrency,
    formatDate,
  };
};

export default useLocale;
