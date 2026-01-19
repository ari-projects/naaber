import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useSwipeToClose from '../../hooks/useSwipeToClose';

function AddFlatDrawer({ isOpen, onClose, onAddSingle, onAddBulk, isAdding }) {
  const { t } = useTranslation(['community', 'common']);
  const { containerRef, dragOffset, shouldRender, isVisible, DragHandle } = useSwipeToClose(onClose, isOpen);
  
  const [mode, setMode] = useState('bulk'); // 'single' or 'bulk'
  const [singleFlatNumber, setSingleFlatNumber] = useState('');
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'single') {
      if (!singleFlatNumber.trim()) {
        setError(t('common:messages.requiredField'));
        return;
      }
      const result = await onAddSingle(singleFlatNumber.trim());
      if (result.success) {
        setSingleFlatNumber('');
        onClose();
      } else {
        setError(result.message || t('common:messages.serverError'));
      }
    } else {
      const from = parseInt(bulkFrom);
      const to = parseInt(bulkTo);
      if (isNaN(from) || isNaN(to) || from > to) {
        setError(t('common:messages.requiredField'));
        return;
      }
      await onAddBulk(from, to, bulkPrefix);
      setBulkFrom('');
      setBulkTo('');
      setBulkPrefix('');
      onClose();
    }
  };

  const handleClose = () => {
    setError('');
    setSingleFlatNumber('');
    setBulkFrom('');
    setBulkTo('');
    setBulkPrefix('');
    onClose();
  };

  if (!shouldRender) return null;

  return createPortal(
    <div 
      className="fixed flex items-end justify-center inset-0 z-[200]"
      style={{
        backgroundColor: `rgba(13, 12, 7, ${isVisible ? 0.5 : 0})`,
        transition: 'background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      onClick={handleClose}
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
          onClick={handleClose}
          className="absolute top-1 right-1 flex justify-center items-center w-9 h-9 rounded-xl transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#56554D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-['Lora'] font-bold text-[22px] leading-8 text-[#0d0c07] mb-0.5">
              {t('flats.drawer.title')}
            </h2>
            <p className="text-[15.2px] leading-7 text-[#65635d]">
              {t('flats.drawer.subtitle')}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="mb-6">
            <div className="bg-[#e5e3dc] rounded-xl p-1 flex gap-3">
              <button
                type="button"
                onClick={() => setMode('bulk')}
                className={`flex-1 rounded-[10px] h-9 px-3 py-1.5 flex items-center justify-center transition-colors ${
                  mode === 'bulk' ? 'bg-white' : ''
                }`}
              >
                <span className="font-semibold text-xs leading-5 text-[#0d0c07]">
                  {t('flats.drawer.manyTab')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 rounded-[10px] h-9 px-3 py-1.5 flex items-center justify-center transition-colors ${
                  mode === 'single' ? 'bg-white' : ''
                }`}
              >
                <span className="font-semibold text-xs leading-5 text-[#0d0c07]">
                  {t('flats.drawer.singleTab')}
                </span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {mode === 'single' ? (
              /* Single Flat Input */
              <div className="bg-[#f8f8f7] rounded-xl border border-[#56554d]/50 h-14">
                <input 
                  type="text"
                  value={singleFlatNumber}
                  onChange={(e) => setSingleFlatNumber(e.target.value)}
                  placeholder={t('flats.flatNumber')}
                  className="w-full h-full bg-transparent border-none outline-none px-3 text-base leading-8 text-[#0d0c07] placeholder:text-[#72726e]"
                  autoFocus
                />
              </div>
            ) : (
              /* Bulk Add Inputs */
              <>
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#f8f8f7] rounded-xl border border-[#56554d]/50 h-14">
                    <input 
                      type="number"
                      value={bulkFrom}
                      onChange={(e) => setBulkFrom(e.target.value)}
                      placeholder={t('flats.bulkAdd.from')}
                      className="w-full h-full bg-transparent border-none outline-none px-3 text-base leading-8 text-[#0d0c07] placeholder:text-[#72726e]"
                      min="1"
                    />
                  </div>
                  <div className="flex-1 bg-[#f8f8f7] rounded-xl border border-[#56554d]/50 h-14">
                    <input 
                      type="number"
                      value={bulkTo}
                      onChange={(e) => setBulkTo(e.target.value)}
                      placeholder={t('flats.bulkAdd.to')}
                      className="w-full h-full bg-transparent border-none outline-none px-3 text-base leading-8 text-[#0d0c07] placeholder:text-[#72726e]"
                      min="1"
                    />
                  </div>
                </div>
                <div className="bg-[#f8f8f7] rounded-xl border border-[#56554d]/50 h-14">
                  <input 
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder={t('flats.drawer.prefixPlaceholder')}
                    className="w-full h-full bg-transparent border-none outline-none px-3 text-base leading-8 text-[#0d0c07] placeholder:text-[#72726e]"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-[#b50b0b]">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-[#e2e1df] rounded-xl h-12 px-4 py-3 flex items-center justify-center"
              >
                <span className="font-semibold text-sm leading-6 text-[#0d0c07]">
                  {t('common:actions.cancel')}
                </span>
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 bg-[#293d29] rounded-xl h-12 px-4 py-3 flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-semibold text-sm leading-6 text-white">
                  {isAdding ? t('common:status.saving') : t('common:actions.add')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddFlatDrawer;
