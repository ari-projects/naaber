import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCommunity } from '../../contexts/CommunityContext';
import backendClient from '../../services/backendClient';
import AddFlatDrawer from './AddFlatDrawer';
import SearchFlatDrawer from './SearchFlatDrawer';
import ConfirmDeleteDrawer from './ConfirmDeleteDrawer';

const FlatManagement = () => {
  const { t } = useTranslation(['community', 'common']);
  const { selectedCommunity, flats, members, fetchFlats, fetchMembers, addFlat, deleteFlat, isLoading } = useCommunity();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'withRequests'

  // Drawer states
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [flatToDelete, setFlatToDelete] = useState(null);
  
  // Legacy modal states (for desktop)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Form states
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flatNotifications, setFlatNotifications] = useState({});

  // Natural sort function for flat numbers (1, 2, 3... instead of 1, 10, 11...)
  const naturalSort = (a, b) => {
    return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
  };

  const sortedFlats = useMemo(() => [...flats].sort(naturalSort), [flats]);

  // Get member count for a flat
  const getMemberCount = (flatId) => {
    return members.filter(m => 
      m.flatId === flatId || m.flat?.id === flatId || m.flat?._id === flatId || m.flat === flatId
    ).length;
  };

  // Get total notifications for a flat
  const getTotalNotifications = (flatId) => {
    const notifications = flatNotifications[flatId];
    if (!notifications) return 0;
    return (notifications.messages || 0) + (notifications.payments || 0) + 
           (notifications.documents || 0) + (notifications.maintenance || 0);
  };

  // Filter flats based on active tab
  const filteredFlats = useMemo(() => {
    if (activeTab === 'withRequests') {
      return sortedFlats.filter(flat => {
        const notifications = flatNotifications[flat.id];
        if (!notifications) return false;
        const total = (notifications.messages || 0) + (notifications.payments || 0) + 
                      (notifications.documents || 0) + (notifications.maintenance || 0);
        return total > 0;
      });
    }
    return sortedFlats;
  }, [sortedFlats, activeTab, flatNotifications]);

  useEffect(() => {
    if (selectedCommunity?.id) {
      fetchFlats(selectedCommunity.id);
      fetchMembers(selectedCommunity.id);
      
      // Mark flats page as visited (for president)
      backendClient.post(`/api/communities/${selectedCommunity.id}/flats/mark-visited`)
        .catch(() => {}); // Ignore errors - might not be president
    }
  }, [selectedCommunity, fetchFlats, fetchMembers]);

  // Fetch notifications for all flats
  useEffect(() => {
    const fetchFlatNotifications = async () => {
      if (!selectedCommunity?.id || flats.length === 0) return;

      try {
        const response = await backendClient.get(`/api/communities/${selectedCommunity.id}/flats/notifications`);
        if (response.success && response.notifications) {
          setFlatNotifications(response.notifications);
          return;
        }
      } catch (err) {
        console.log('Dedicated notifications endpoint not available, fetching from individual sources...');
      }

      try {
        const notificationsMap = {};
        const maintenanceRes = await backendClient.get(`/api/communities/${selectedCommunity.id}/maintenance`);
        const maintenanceRequests = maintenanceRes.success ? (maintenanceRes.requests || []) : [];
        const paymentsRes = await backendClient.get(`/api/communities/${selectedCommunity.id}/payments`);
        const payments = paymentsRes.success ? (paymentsRes.payments || []) : [];
        const documentsRes = await backendClient.get(`/api/communities/${selectedCommunity.id}/documents`);
        const documents = documentsRes.success ? (documentsRes.documents || []) : [];

        for (const flat of flats) {
          const flatId = flat.id || flat._id;
          const flatMaintenance = maintenanceRequests.filter(r => 
            (r.flatId === flatId || r.flat === flatId || r.flat?.id === flatId || r.flat?._id === flatId) &&
            (r.status === 'open' || r.status === 'in_progress')
          ).length;
          const flatPayments = payments.filter(p => 
            (p.flatId === flatId || p.flat === flatId || p.flat?.id === flatId || p.flat?._id === flatId) &&
            (p.status === 'pending' || p.status === 'overdue')
          ).length;
          const flatDocuments = documents.filter(d => 
            (d.flatId === flatId || d.flat === flatId || d.flat?.id === flatId || d.flat?._id === flatId) &&
            !d.reviewed
          ).length;

          if (flatMaintenance > 0 || flatPayments > 0 || flatDocuments > 0) {
            notificationsMap[flatId] = {
              maintenance: flatMaintenance,
              payments: flatPayments,
              documents: flatDocuments,
              messages: 0
            };
          }
        }
        setFlatNotifications(notificationsMap);
      } catch (err) {
        console.error('Failed to fetch flat notifications:', err);
      }
    };

    fetchFlatNotifications();
  }, [selectedCommunity, flats]);

  // Add single flat handler
  const handleAddSingleFlat = async (flatNumber) => {
    setIsAdding(true);
    const result = await addFlat(flatNumber);
    setIsAdding(false);
    return result;
  };

  // Add bulk flats handler
  const handleAddBulkFlats = async (from, to, prefix) => {
    setIsAdding(true);
    for (let i = from; i <= to; i++) {
      const flatNumber = prefix ? `${prefix}${i}` : String(i);
      await addFlat(flatNumber);
    }
    setIsAdding(false);
  };

  // Delete flat handler
  const handleDeleteFlat = async (flatId) => {
    setIsDeleting(true);
    await deleteFlat(flatId);
    setIsDeleting(false);
    setFlatToDelete(null);
  };

  // Open delete confirmation
  const openDeleteConfirm = (flat, e) => {
    e.stopPropagation();
    setFlatToDelete(flat);
    setShowDeleteDrawer(true);
  };

  // Navigate to flat details
  const handleSelectFlat = (flat) => {
    navigate(`/flats/${flat.id}`);
  };

  // Legacy modal handlers for desktop
  const handleAddFlatLegacy = async (e) => {
    e.preventDefault();
    if (!newFlatNumber.trim()) {
      setError(t('common:messages.requiredField'));
      return;
    }
    setIsAdding(true);
    setError('');
    const result = await addFlat(newFlatNumber.trim());
    if (result.success) {
      setNewFlatNumber('');
      setShowAddModal(false);
    } else {
      setError(result.message || t('common:messages.serverError'));
    }
    setIsAdding(false);
  };

  const handleBulkAddLegacy = async (e) => {
    e.preventDefault();
    const from = parseInt(bulkFrom);
    const to = parseInt(bulkTo);
    if (isNaN(from) || isNaN(to) || from > to) {
      setError(t('common:messages.requiredField'));
      return;
    }
    setIsAdding(true);
    setError('');
    for (let i = from; i <= to; i++) {
      const flatNumber = bulkPrefix ? `${bulkPrefix}${i}` : String(i);
      await addFlat(flatNumber);
    }
    setBulkFrom('');
    setBulkTo('');
    setBulkPrefix('');
    setShowBulkModal(false);
    setIsAdding(false);
  };

  // Get request text with proper pluralization
  const getRequestText = (count) => {
    if (count === 0) {
      return t('flats.noRequests');
    }
    return t('flats.requestsCount', { count });
  };

  return (
    <div className="min-h-screen bg-[#EEEDE7]">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex gap-1 items-center min-h-[52px] py-2">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path d="M11.3819 5.54785C11.7236 5.20652 12.2776 5.20642 12.6192 5.54785C12.9608 5.88957 12.9609 6.44447 12.6192 6.78613L8.28036 11.125H17.8341C18.317 11.1253 18.7089 11.5171 18.7091 12C18.709 12.483 18.317 12.8747 17.8341 12.875H8.27938L12.6192 17.2148C12.9607 17.5565 12.9607 18.1105 12.6192 18.4521C12.2776 18.7938 11.7236 18.7937 11.3819 18.4521L5.54793 12.6191C5.2065 12.2775 5.20661 11.7235 5.54793 11.3818L11.3819 5.54785Z" fill="#0D0C07"/>
            </svg>
          </button>
          
          {/* Title */}
          <h1 className="flex-1 font-['Lora'] font-bold text-[22px] leading-8 text-[#0D0C07]">
            {t('flats.title')}
          </h1>
          
          {/* Search Button */}
          <button 
            onClick={() => setShowSearchDrawer(true)}
            className="flex items-center justify-center px-3 py-1.5 rounded-xl hover:bg-gray-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path d="M11.1671 3.625C15.3321 3.62518 18.7081 7.00195 18.7081 11.167C18.708 12.9341 18.0981 14.5572 17.0802 15.8428L20.1192 18.8809C20.4609 19.2226 20.4609 19.7774 20.1192 20.1191C19.7775 20.4609 19.2227 20.4608 18.8809 20.1191L15.8429 17.0801C14.5573 18.098 12.9341 18.7079 11.1671 18.708C7.00204 18.708 3.62526 15.332 3.62508 11.167C3.62508 7.00185 7.00193 3.625 11.1671 3.625ZM11.1671 5.375C7.96843 5.375 5.37508 7.96834 5.37508 11.167C5.37526 14.3655 7.96853 16.958 11.1671 16.958C14.3655 16.9578 16.9579 14.3654 16.9581 11.167C16.9581 7.96845 14.3656 5.37518 11.1671 5.375Z" fill="#0D0C07"/>
            </svg>
          </button>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-[#293D29] text-white rounded-xl hover:bg-[#1e2e1e] transition-colors text-sm font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('flats.addFlat')}
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center px-4 py-2 bg-white text-[#0d0c07] border border-[#e5e3dc] rounded-xl hover:bg-[#f0efed] transition-colors text-sm font-semibold"
            >
              {t('flats.addMultiple')}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 pb-6">
        <div className="bg-[#E5E3DC] flex gap-3 p-1 rounded-xl">
          {/* All Tab */}
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-[10px] font-semibold text-xs leading-5 text-[#0D0C07] transition-colors ${
              activeTab === 'all' ? 'bg-white' : ''
            }`}
          >
            {t('flats.tabs.all')}
          </button>
          
          {/* With Requests Tab */}
          <button 
            onClick={() => setActiveTab('withRequests')}
            className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-[10px] font-semibold text-xs leading-5 text-[#0D0C07] transition-colors ${
              activeTab === 'withRequests' ? 'bg-white' : ''
            }`}
          >
            {t('flats.tabs.withRequests')}
          </button>
        </div>
      </div>

      {/* Flats Grid */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-[#56554D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredFlats.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#EBEBEA] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#56554D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
                <path d="M9 9v.01"/>
                <path d="M9 12v.01"/>
                <path d="M9 15v.01"/>
                <path d="M9 18v.01"/>
              </svg>
            </div>
            <p className="text-[#0D0C07] font-semibold text-sm mb-1">
              {activeTab === 'withRequests' ? t('flats.noFlatsWithRequests') : t('flats.noFlats')}
            </p>
            <p className="text-xs text-[#56554D]">
              {activeTab === 'withRequests' ? t('flats.noFlatsWithRequestsSubtitle') : t('flats.noFlatsSubtitle')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFlats.map((flat, index) => {
              const memberCount = getMemberCount(flat.id);
              const notificationCount = getTotalNotifications(flat.id);
              const hasRequests = notificationCount > 0;
              // Make last odd item full width on mobile only
              const isLastOdd = index === filteredFlats.length - 1 && filteredFlats.length % 2 === 1;
              
              return (
                <div 
                  key={flat.id} 
                  className={`bg-[#F8F8F7] md:p-5 rounded-[12px] p-4 relative shadow-[0_1px_2px_0_rgba(35,33,22,0.02),2px_6px_12px_0_rgba(83,81,69,0.06)] cursor-pointer transition-all hover:shadow-md ${
                    hasRequests ? 'border border-[#B50B0B]' : 'border border-white'
                  } ${isLastOdd ? 'col-span-2 md:col-span-1' : ''}`}
                  onClick={() => navigate(`/flats/${flat.id}`)}
                >
                  {/* Flat Number Badge */}
                  <div className="bg-[#EBEBEA] w-8 h-8 rounded-md flex items-center justify-center mb-2">
                    <span className="font-medium text-[#56554D] leading-7">{flat.number}</span>
                  </div>
                  
                  {/* Request Status */}
                  <h3 className={`text-sm leading-6 ${hasRequests ? 'text-[#B50B0B] font-semibold' : 'text-[#0D0C07] font-normal'}`}>
                    {getRequestText(notificationCount)}
                  </h3>
                  
                  {/* Residents Count */}
                  <p className="text-xs leading-5 text-[#56554D]">
                    {memberCount} {t('flats.residents', { count: memberCount })}
                  </p>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => openDeleteConfirm(flat, e)}
                    className="absolute top-3 right-3 w-4 h-4 hover:opacity-70 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                      <path d="M12 4L4 12M4 4L12 12" stroke="#A09F9C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button - Mobile only */}
      <div 
        className="md:hidden fixed right-6 z-50"
        style={{ 
          bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          padding: '8px',
          borderRadius: '16px',
          border: '1px solid #FFF',
          background: 'rgba(255, 255, 255, 0.60)',
          boxShadow: '0 0 1px 0 rgba(13, 12, 7, 0.12), 0 -4px 24px 0 rgba(13, 12, 7, 0.12), 1px -2px 8px 0 rgba(13, 12, 7, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <button
          onClick={() => setShowAddDrawer(true)}
          className="bg-[#293D29] hover:bg-[#1e2e1e] w-12 h-12 rounded-[12px] flex items-center justify-center transition-colors"
          style={{ border: '0.5px solid #293D29' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
            <path d="M12.0001 5.29199C12.4832 5.29217 12.8751 5.68385 12.8751 6.16699V11.125H17.8341C18.3169 11.1254 18.7089 11.5171 18.7091 12C18.7089 12.4829 18.3169 12.8746 17.8341 12.875H12.8751V17.834C12.8747 18.3168 12.483 18.7088 12.0001 18.709C11.5172 18.7088 11.1254 18.3168 11.1251 17.834V12.875H6.16708C5.68393 12.875 5.29225 12.4831 5.29208 12C5.29225 11.5169 5.68393 11.125 6.16708 11.125H11.1251V6.16699C11.1251 5.68385 11.517 5.29217 12.0001 5.29199Z" fill="white"/>
          </svg>
        </button>
      </div>

      {/* Mobile Drawers */}
      <AddFlatDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onAddSingle={handleAddSingleFlat}
        onAddBulk={handleAddBulkFlats}
        isAdding={isAdding}
      />
      
      <SearchFlatDrawer
        isOpen={showSearchDrawer}
        onClose={() => setShowSearchDrawer(false)}
        flats={flats}
        members={members}
        onSelectFlat={handleSelectFlat}
      />
      
      <ConfirmDeleteDrawer
        isOpen={showDeleteDrawer}
        onClose={() => {
          setShowDeleteDrawer(false);
          setFlatToDelete(null);
        }}
        flat={flatToDelete}
        onConfirm={handleDeleteFlat}
        isDeleting={isDeleting}
      />

      {/* Desktop Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0d0c07]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w
-full p-6">
            <h3 className="font-['Lora'] font-bold text-lg text-[#0d0c07] mb-4">{t('flats.addFlat')}</h3>
            <form onSubmit={handleAddFlatLegacy}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#0d0c07] mb-1">{t('flats.flatNumber')}</label>
                <input
                  type="text"
                  value={newFlatNumber}
                  onChange={(e) => setNewFlatNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e5e3dc] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#56554D]/30"
                  placeholder="e.g., 14, 3B"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-[#b50b0b] mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setError(''); setNewFlatNumber(''); }}
                  className="flex-1 px-4 py-2.5 border border-[#e5e3dc] rounded-xl text-[#0d0c07] hover:bg-[#f8f8f7] transition-colors"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 px-4 py-2.5 bg-[#293D29] text-white rounded-xl hover:bg-[#1e2e1e] disabled:opacity-50 transition-colors"
                >
                  {isAdding ? t('common:status.saving') : t('common:actions.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-[#0d0c07]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="font-['Lora'] font-bold text-lg text-[#0d0c07] mb-4">{t('flats.bulkAdd.title')}</h3>
            <form onSubmit={handleBulkAddLegacy}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#0d0c07] mb-1">{t('flats.bulkAdd.from')}</label>
                  <input
                    type="number"
                    value={bulkFrom}
                    onChange={(e) => setBulkFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e5e3dc] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#56554D]/30"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0d0c07] mb-1">{t('flats.bulkAdd.to')}</label>
                  <input
                    type="number"
                    value={bulkTo}
                    onChange={(e) => setBulkTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e5e3dc] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#56554D]/30"
                    placeholder="50"
                    min="1"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#0d0c07] mb-1">{t('flats.bulkAdd.prefix')}</label>
                <input
                  type="text"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e5e3dc] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#56554D]/30"
                  placeholder="A"
                />
                <p className="text-xs text-[#56554D] mt-1">{t('flats.bulkAdd.example')}</p>
              </div>
              {error && <p className="text-sm text-[#b50b0b] mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowBulkModal(false); setError(''); setBulkFrom(''); setBulkTo(''); setBulkPrefix(''); }}
                  className="flex-1 px-4 py-2.5 border border-[#e5e3dc] rounded-xl text-[#0d0c07] hover:bg-[#f8f8f7] transition-colors"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 px-4 py-2.5 bg-[#293D29] text-white rounded-xl hover:bg-[#1e2e1e] disabled:opacity-50 transition-colors"
                >
                  {isAdding ? t('common:status.saving') : t('common:actions.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlatManagement;
