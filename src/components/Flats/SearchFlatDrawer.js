import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useSwipeToClose from '../../hooks/useSwipeToClose';

function SearchFlatDrawer({ isOpen, onClose, flats, members, onSelectFlat }) {
  const { t } = useTranslation(['community', 'common']);
  const { containerRef, dragOffset, shouldRender, isVisible, DragHandle } = useSwipeToClose(onClose, isOpen);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFlats, setFilteredFlats] = useState([]);

  // Get member count for a flat
  const getMemberCount = (flatId) => {
    return members.filter(m => 
      m.flatId === flatId || m.flat?.id === flatId || m.flat?._id === flatId || m.flat === flatId
    ).length;
  };

  // Natural sort function for flat numbers
  const naturalSort = (a, b) => {
    return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
  };

  // Filter flats based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFlats([...flats].sort(naturalSort));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = flats.filter(flat => {
      // Search by flat number
      if (flat.number.toLowerCase().includes(query)) {
        return true;
      }
      // Search by resident name
      const flatMembers = members.filter(m => 
        m.flatId === flat.id || m.flat?.id === flat.id || m.flat?._id === flat.id || m.flat === flat.id
      );
      return flatMembers.some(member => 
        member.name?.toLowerCase().includes(query) || 
        member.email?.toLowerCase().includes(query)
      );
    });
    setFilteredFlats(filtered.sort(naturalSort));
  }, [searchQuery, flats, members]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelectFlat = (flat) => {
    onSelectFlat(flat);
    handleClose();
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
          height: '70vh',
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
        <div className="flex flex-col flex-1 overflow-hidden px-6 pt-8 pb-4">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-['Lora'] font-bold text-[22px] leading-8 text-[#0d0c07] mb-0.5">
              {t('flats.searchDrawer.title')}
            </h2>
            <p className="text-[15.2px] leading-7 text-[#65635d]">
              {t('flats.searchDrawer.subtitle')}
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="bg-[#f8f8f7] rounded-xl border border-[#56554d]/50 h-14 flex items-center px-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#72726e] mr-2 flex-shrink-0">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('flats.searchPlaceholder')}
                className="flex-1 bg-transparent border-none outline-none text-base leading-8 text-[#0d0c07] placeholder:text-[#72726e]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 ml-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#72726e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {filteredFlats.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-[#72726e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="mt-4 text-[#65635d] font-medium">{t('flats.searchDrawer.noResults')}</p>
                <p className="mt-1 text-sm text-[#72726e]">{t('flats.searchDrawer.tryDifferentSearch')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {filteredFlats.map((flat, index) => {
                  const memberCount = getMemberCount(flat.id);
                  // Make last odd item full width
                  const isLastOdd = index === filteredFlats.length - 1 && filteredFlats.length % 2 === 1;
                  
                  return (
                    <button
                      key={flat.id}
                      onClick={() => handleSelectFlat(flat)}
                      className={`bg-white rounded-2xl p-4 text-left transition-all active:scale-[0.98] border border-transparent hover:border-[#293d29]/20 ${
                        isLastOdd ? 'col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-[#e5e3dc] rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-[#0d0c07]">{flat.number}</span>
                        </div>
                        <div className="flex items-center text-[#65635d]">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 21C18 18.8783 17.1571 16.8434 15.6569 15.3431C14.1566 13.8429 12.1217 13 10 13M10 13C7.87827 13 5.84344 13.8429 4.34315 15.3431C2.84285 16.8434 2 18.8783 2 21M10 13C12.7614 13 15 10.7614 15 8C15 5.23858 12.7614 3 10 3C7.23858 3 5 5.23858 5 8C5 10.7614 7.23858 13 10 13Z" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-xs font-medium">{memberCount}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#65635d]">
                        {memberCount} {t('flats.residents', { count: memberCount })}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SearchFlatDrawer;
