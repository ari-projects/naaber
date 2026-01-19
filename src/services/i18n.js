/**
 * i18n Configuration
 *
 * Centralized internationalization setup using react-i18next.
 * Supports Russian (ru), Estonian (et), and English (en) languages.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Russian translation files
import ruCommon from '../locales/ru/common.json';
import ruAuth from '../locales/ru/auth.json';
import ruDashboard from '../locales/ru/dashboard.json';
import ruCommunity from '../locales/ru/community.json';
import ruAnnouncements from '../locales/ru/announcements.json';
import ruChat from '../locales/ru/chat.json';
import ruMessages from '../locales/ru/messages.json';
import ruMaintenance from '../locales/ru/maintenance.json';
import ruDocuments from '../locales/ru/documents.json';
import ruPayments from '../locales/ru/payments.json';
import ruEvents from '../locales/ru/events.json';
import ruProfile from '../locales/ru/profile.json';
import ruMeters from '../locales/ru/meters.json';

// Import Estonian translation files
import etCommon from '../locales/et/common.json';
import etAuth from '../locales/et/auth.json';
import etDashboard from '../locales/et/dashboard.json';
import etCommunity from '../locales/et/community.json';
import etAnnouncements from '../locales/et/announcements.json';
import etChat from '../locales/et/chat.json';
import etMessages from '../locales/et/messages.json';
import etMaintenance from '../locales/et/maintenance.json';
import etDocuments from '../locales/et/documents.json';
import etPayments from '../locales/et/payments.json';
import etEvents from '../locales/et/events.json';
import etProfile from '../locales/et/profile.json';
import etMeters from '../locales/et/meters.json';

// Import English translation files
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enCommunity from '../locales/en/community.json';
import enAnnouncements from '../locales/en/announcements.json';
import enChat from '../locales/en/chat.json';
import enMessages from '../locales/en/messages.json';
import enMaintenance from '../locales/en/maintenance.json';
import enDocuments from '../locales/en/documents.json';
import enPayments from '../locales/en/payments.json';
import enEvents from '../locales/en/events.json';
import enProfile from '../locales/en/profile.json';
import enMeters from '../locales/en/meters.json';

// Combine all namespaces for each language
const resources = {
  ru: {
    common: ruCommon,
    auth: ruAuth,
    dashboard: ruDashboard,
    community: ruCommunity,
    announcements: ruAnnouncements,
    chat: ruChat,
    messages: ruMessages,
    maintenance: ruMaintenance,
    documents: ruDocuments,
    payments: ruPayments,
    events: ruEvents,
    profile: ruProfile,
    meters: ruMeters,
  },
  et: {
    common: etCommon,
    auth: etAuth,
    dashboard: etDashboard,
    community: etCommunity,
    announcements: etAnnouncements,
    chat: etChat,
    messages: etMessages,
    maintenance: etMaintenance,
    documents: etDocuments,
    payments: etPayments,
    events: etEvents,
    profile: etProfile,
    meters: etMeters,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    community: enCommunity,
    announcements: enAnnouncements,
    chat: enChat,
    messages: enMessages,
    maintenance: enMaintenance,
    documents: enDocuments,
    payments: enPayments,
    events: enEvents,
    profile: enProfile,
    meters: enMeters,
  },
};

// Supported languages configuration
export const supportedLanguages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

i18n
  // Detect user language from browser/localStorage
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'ru', // Russian is the main language
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'community', 'announcements', 'chat', 'messages', 'maintenance', 'documents', 'payments', 'events', 'profile', 'meters'],

    // Language detection options
    detection: {
      // Order of language detection methods - only check localStorage, not browser
      order: ['localStorage'],
      // Key to store selected language in localStorage
      lookupLocalStorage: 'i18nextLng',
      // Cache the detected language
      caches: ['localStorage'],
    },

    // Default to Russian if nothing is stored
    lng: localStorage.getItem('i18nextLng') || 'ru',

    interpolation: {
      // React already escapes values
      escapeValue: false,
    },

    // Disable suspense to prevent race conditions
    react: {
      useSuspense: false,
    },

    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
  });

/**
 * Change the current language
 * @param {string} languageCode - The language code (e.g., 'ru', 'et', 'en')
 */
export const changeLanguage = (languageCode) => {
  i18n.changeLanguage(languageCode);
};

/**
 * Get the current language code
 * @returns {string} The current language code
 */
export const getCurrentLanguage = () => {
  return i18n.language || 'ru';
};

/**
 * Check if a language is supported
 * @param {string} languageCode - The language code to check
 * @returns {boolean} True if the language is supported
 */
export const isLanguageSupported = (languageCode) => {
  return supportedLanguages.some(lang => lang.code === languageCode);
};

export default i18n;
