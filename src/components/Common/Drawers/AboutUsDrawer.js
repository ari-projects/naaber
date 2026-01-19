import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useSwipeToClose from '../../../hooks/useSwipeToClose';

function AboutUsDrawer({ isOpen, onClose }) {
  const { t } = useTranslation('pages');
  const { containerRef, dragOffset, shouldRender, isVisible, DragHandle } = useSwipeToClose(onClose, isOpen);

  if (!shouldRender) return null;

  return createPortal(
    <div 
      className={`fixed flex items-end justify-center inset-0 z-[200] drawer-overlay`} 
      style={{
        backgroundColor: `rgba(13, 12, 7, ${isVisible ? 0.5 : 0})`,
        transition: 'background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className={`flex flex-col w-full bg-[#F8F8F7] rounded-[12px_12px_0px_0px] max-w-5xl mx-auto shadow-lg drawer-content overflow-hidden`}
        style={{
          maxHeight: 'calc(100dvh - 44px - env(safe-area-inset-top, 0px))',
          height: 'auto',
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
          className="absolute top-1 right-1 flex justify-center items-center md:hover:bg-gray-200 w-[36px] h-[36px] rounded-[12px] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16.381 6.38079C16.7227 6.03908 17.2776 6.03908 17.6193 6.38079C17.961 6.7225 17.961 7.27737 17.6193 7.61907L13.2385 11.9999L17.6193 16.3808L17.6789 16.4472C17.9595 16.7909 17.9398 17.2986 17.6193 17.6191C17.2989 17.9395 16.7911 17.9592 16.4474 17.6786L16.381 17.6191L12.0002 13.2382L7.61932 17.6191C7.27761 17.9608 6.72275 17.9608 6.38104 17.6191C6.03933 17.2774 6.03933 16.7225 6.38104 16.3808L10.7619 11.9999L6.38104 7.61907L6.32147 7.55267C6.04089 7.20899 6.06059 6.70124 6.38104 6.38079C6.70149 6.06034 7.20923 6.04064 7.55291 6.32122L7.61932 6.38079L12.0002 10.7617L16.381 6.38079Z" fill="#56554D"/>
          </svg>
        </button>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden p-8 pb-[116px]">
          <h2 className="
                    text-[var(--Color-Grays-Gray-10,#0D0C07)]
                    text-[16px]
                    font-bold
                    leading-[32px]
                    w-full
                    mb-4
                  ">{t('about.title')}</h2>
          
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/about-us.png"
              alt={t('about.missionAlt')}
              className="mb-6 rounded-[12px] max-h-48 object-contain"
            />
            <p className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[24px] text-center max-w-md">
              {t('about.description')}
            </p>
          </div>
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/about-us.png"
              alt={t('about.teamAlt')}
              className="mb-6 rounded-[12px] max-h-48 object-contain"
            />
            <p className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[24px] text-center max-w-md">
              {t('about.description')}
            </p>
          </div>
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/about-us.png"
              alt={t('about.visionAlt')}
              className="mb-6 rounded-[12px] max-h-48 object-contain"
            />
            <p className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[24px] text-center max-w-md">
              {t('about.description')}
            </p>
          </div>
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/about-us.png"
              alt={t('about.missionAlt')}
              className="mb-6 rounded-[12px] max-h-48 object-contain"
            />
            <p className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[24px] text-center max-w-md">
              {t('about.description')}
            </p>
          </div>
        </div>
          
        <div
          className="
            fixed bottom-0 left-0 right-0
            pt-2 pb-4 px-0
            flex justify-center
            bg-white
            z-10
            rounded-[12px_12px_0px_0px]
            shadow-[0px_0px_1px_0px_rgba(13,12,7,0.12),_0px_-4px_24px_0px_rgba(13,12,7,0.12),_1px_-2px_8px_0px_rgba(13,12,7,0.08)]
          "
        >
          <div className="w-full max-w-5xl px-6 gap-4 flex items-center justify-between">
            <button
              className="
                    inline-flex justify-center items-center gap-1
                    h-[56px] px-[24px] py-[14px]
                    rounded-[12px]
                    border-[0.5px] border-[#060]
                    bg-[#060]
                    text-[#FFF] text-center
                    text-[15.2px] font-medium leading-[28px]
                    transition-colors
                    md:hover:border-[0.5px] md:hover:border-[#090]
                    md:hover:bg-[#090]
                    w-full
                  "
              onClick={onClose}
            >
              <span>{t('common:buttons.close', 'Close')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

export default AboutUsDrawer;
