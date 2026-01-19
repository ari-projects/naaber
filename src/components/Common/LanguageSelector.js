/**
 * LanguageSelector Component
 *
 * A dropdown component for switching between available languages.
 * Can be used in header, settings, or any other part of the app.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../../services/i18n';

const LanguageSelector = ({
  variant = 'dropdown', // 'dropdown' | 'toggle' | 'minimal'
  showFlag = true,
  showName = true,
  className = ''
}) => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const currentLanguageInfo = supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];

  const switchLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const toggleLanguage = () => {
    const currentIndex = supportedLanguages.findIndex(lang => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    i18n.changeLanguage(supportedLanguages[nextIndex].code);
  };
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle variant - simple button that cycles through languages
  if (variant === 'toggle') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
        aria-label={`Current language: ${currentLanguageInfo.name}. Click to switch.`}
      >
        {showFlag && <span className="text-lg">{currentLanguageInfo.flag}</span>}
        {showName && <span className="text-sm font-medium">{currentLanguageInfo.code.toUpperCase()}</span>}
      </button>
    );
  }

  // Minimal variant - just the flag/code
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleLanguage}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${className}`}
        aria-label={`Current language: ${currentLanguageInfo.name}. Click to switch.`}
      >
        {showFlag ? (
          <span className="text-xl">{currentLanguageInfo.flag}</span>
        ) : (
          <span className="text-sm font-medium">{currentLanguageInfo.code.toUpperCase()}</span>
        )}
      </button>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#65635D]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlag && <span className="text-lg">{currentLanguageInfo.flag}</span>}
        {showName && <span className="text-sm font-medium">{currentLanguageInfo.code.toUpperCase()}</span>}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-[#E2E1DF] min-w-[140px] z-50"
          role="listbox"
          aria-label="Select language"
        >
          {supportedLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                switchLanguage(language.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left ${
                language.code === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-[#0D0C07]'
              }`}
              role="option"
              aria-selected={language.code === currentLanguage}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
              {language.code === currentLanguage && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
