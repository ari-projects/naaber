import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useSwipeToClose from '../../hooks/useSwipeToClose';

function ConfirmDeleteDrawer({ isOpen, onClose, flat, onConfirm, isDeleting }) {
  const { t } = useTranslation(['community', 'common']);
  const { containerRef, dragOffset, shouldRender, isVisible, DragHandle } = useSwipeToClose(onClose, isOpen);

  const handleConfirm = async () => {
    await onConfirm(flat.id);
    onClose();
  };

  if (!shouldRender || !flat) return null;

  return createPortal(
    <div 
      className="fixed flex items-end justify-center inset-0 z-[200]"
      style={{
        backgroundColor: `rgba(13, 12, 7, ${isVisible ? 0.5 : 0})`,
        transition: 'background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="flex flex-col w-full bg-[#F8F8F7] rounded-t-2xl max-w-5xl mx-auto shadow-lg overflow-hidden"
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
          className="absolute top-1 right-1 flex justify-center items-center w-9 h-9 rounded-xl transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#56554D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#fee2e2] rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b50b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="font-['Lora'] font-bold text-[22px] leading-8 text-[#0d0c07] mb-2">
              {t('flats.deleteDrawer.title')}
            </h2>
            <p className="text-[15.2px] leading-7 text-[#65635d]">
              {t('flats.deleteDrawer.subtitle', { number: flat.number })}
            </p>
          </div>

          {/* Warning */}
          <div className="bg-[#fef3cd] border border-[#ffc107]/30 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 mr-3">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm text-[#856404]">
                {t('flats.deleteDrawer.warning')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#e2e1df] rounded-xl h-12 px-4 py-3 flex items-center justify-center"
            >
              <span className="font-semibold text-sm leading-6 text-[#0d0c07]">
                {t('common:actions.cancel')}
              </span>
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 bg-[#b50b0b] rounded-xl h-12 px-4 py-3 flex items-center justify-center disabled:opacity-50"
            >
              <span className="font-semibold text-sm leading-6 text-white">
                {isDeleting ? t('common:status.deleting') : t('common:actions.delete')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDeleteDrawer;
