import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useSwipeToClose from '../../../hooks/useSwipeToClose';
import { supportedLanguages, getCurrentLanguage, changeLanguage } from '../../../services/i18n';

const LanguageDrawer = ({ isOpen, onClose, onLanguageChange }) => {
  const { t } = useTranslation('common');
  const { containerRef, dragOffset, shouldRender, isVisible, DragHandle } = useSwipeToClose(onClose, isOpen);
  const currentLanguage = getCurrentLanguage();

  if (!shouldRender) return null;

  const handleLanguageSelect = (languageCode) => {
    changeLanguage(languageCode);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    onClose();
  };

  return createPortal(
    <div 
      className="fixed flex items-end justify-center inset-0 bg-[#0D0C07] z-[200] drawer-overlay"
      style={{
        backgroundColor: `rgba(13, 12, 7, ${isVisible ? 0.5 : 0})`,
        transition: 'background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="flex flex-col w-full bg-[#F8F8F7] rounded-[12px_12px_0px_0px] max-w-5xl mx-auto shadow-lg drawer-content"
        style={{
          transform: isVisible 
            ? `translateY(${Math.max(0, dragOffset)}px)` 
            : 'translateY(100%)',
          transition: dragOffset === 0 
            ? 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <DragHandle />
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-1 right-1 flex justify-center items-center md:hover:bg-gray-200 w-[36px] h-[36px] rounded-[12px] transition-colors z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16.381 6.38079C16.7227 6.03908 17.2776 6.03908 17.6193 6.38079C17.961 6.7225 17.961 7.27737 17.6193 7.61907L13.2385 11.9999L17.6193 16.3808L17.6789 16.4472C17.9595 16.7909 17.9398 17.2986 17.6193 17.6191C17.2989 17.9395 16.7911 17.9592 16.4474 17.6786L16.381 17.6191L12.0002 13.2382L7.61932 17.6191C7.27761 17.9608 6.72275 17.9608 6.38104 17.6191C6.03933 17.2774 6.03933 16.7225 6.38104 16.3808L10.7619 11.9999L6.38104 7.61907L6.32147 7.55267C6.04089 7.20899 6.06059 6.70124 6.38104 6.38079C6.70149 6.06034 7.20923 6.04064 7.55291 6.32122L7.61932 6.38079L12.0002 10.7617L16.381 6.38079Z" fill="#56554D"/>
          </svg>
        </button>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden p-8 pb-8">
          <h2 className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[16px] font-bold leading-[32px] w-full mb-4">
            {t('labels.selectLanguage', 'Select Language')}
          </h2>
          
          <div className="flex flex-col gap-3 pb-6">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                className={`p-4 text-left text-[14px] leading-[24px] font-semibold rounded-[12px] border-[0.5px] border-[#0D0C07] flex items-center ${
                  language.code === currentLanguage 
                    ? 'bg-[#FFCB00] md:hover:bg-[#FFCB00]/90' 
                    : 'bg-white md:hover:bg-[#F8F8F7]'
                }`}
                onClick={() => handleLanguageSelect(language.code)}
              >
                <span className="mr-3 text-2xl">{language.flag}</span>
                <span>{language.name}</span>
                {language.code === currentLanguage && (
                  <svg className="ml-auto" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#0D0C07" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LanguageDrawer;
