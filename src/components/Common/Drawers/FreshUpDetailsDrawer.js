import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useSwipeToClose from '../../../hooks/useSwipeToClose';

function FreshUpDetailsDrawer({ isOpen, onClose }) {
  const { t } = useTranslation('mealplan');
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
        className={`flex flex-col w-full bg-[#F8F8F7] rounded-[12px_12px_0px_0px] max-w-5xl mx-auto shadow-lg drawer-content overflow-hidden  pb-8`}
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
        <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden p-6 pb-[env(safe-area-inset-bottom,24px)]">
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[#0d0c07] text-[24px] font-bold leading-[40px]">    
              {t('freshUpDrawer.title')}
            </h2>
          </div>
          
          {/* Main description */}
          <p className="text-[var(--Color-Grays-Gray-8,#56554D)] text-[15px] leading-[24px] mb-5">
            {t('freshUpDrawer.mainDescription')}
          </p>
          

          {/* Info Card - Yellow */}
            <div className="bg-[rgba(255,203,0,0.24)] relative rounded-[12px] mb-5">
              <div className="flex gap-3 items-start px-4 py-2">
                {/* Icon */}
                <div className="flex items-center justify-center h-7 py-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M10.5 3L8 9L12 22M12 22L16 9L13.5 3M12 22C12.3172 22 12.6293 21.9245 12.9116 21.7799C13.1939 21.6352 13.4378 21.4255 13.623 21.168L21.613 10.182C21.8665 9.83605 22.0021 9.41776 21.9998 8.98885C21.9975 8.55995 21.8573 8.14316 21.6 7.8L18.6 3.8C18.4137 3.55161 18.1721 3.35 17.8944 3.21115C17.6167 3.07229 17.3105 3 17 3H7C6.68891 3.00004 6.38213 3.07264 6.10403 3.21204C5.82593 3.35144 5.58418 3.55379 5.398 3.803L2.4 7.8C2.14256 8.14306 2.00222 8.55979 1.9997 8.98869C1.99718 9.41759 2.13261 9.83594 2.386 10.182L10.376 21.168C10.5612 21.4255 10.8051 21.6352 11.0874 21.7799C11.3696 21.9245 11.6828 22 12 22ZM2 9H22" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Text */}
                <p className="text-[#0d0c07] text-[14px] leading-[28px]">
                  {t('freshUpDrawer.freshnessExplanation')}
                </p>
              </div>
            </div>
          
          {/* Benefits list */}
          <ul className="space-y-3 mb-5">
            <li className="flex items-center gap-3">
              <span className="text-lg">👨‍🍳</span>
              <span className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[22px]">
                {t('freshUpDrawer.benefits.cookWhenYouWant')}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg">📅</span>
              <span className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[22px]">
                {t('freshUpDrawer.benefits.skipMeals')}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg">🍽️</span>
              <span className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[22px]">
                {t('freshUpDrawer.benefits.nothingBreaks')}
              </span>
            </li>
          </ul>
          
          {/* Target audience */}
          <div className="border-t border-[#E0E0DE] pt-4 mb-4">
            <p className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[14px] leading-[22px] font-medium mb-2">
              {t('freshUpDrawer.targetAudience')}
            </p>
            <p className="text-[var(--Color-Grays-Gray-8,#56554D)] text-[14px] leading-[22px] italic">
              {t('freshUpDrawer.tagline')}
            </p>
          </div>
        
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FreshUpDetailsDrawer;
