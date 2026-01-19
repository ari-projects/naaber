import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCommunity } from '../../contexts/CommunityContext';
import backendClient from '../../services/backendClient';
import { 
  initializeSocket, 
  joinCommunity, 
  leaveCommunity, 
  subscribe, 
  unsubscribe, 
  disconnectSocket,
  EVENTS 
} from '../../services/socketService';

const PresidentDashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const {
    communities,
    selectedCommunity,
    fetchCommunities,
    selectCommunity,
    flats,
    members,
    pendingMembers,
    fetchFlats,
    fetchMembers,
    isLoading
  } = useCommunity();
  const navigate = useNavigate();
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeRequests: 0,
    newMessages: 0,
    pendingMembers: 0,
    pendingMeterReadings: 0,
    flatsWithUpdates: 0
  });

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Fetch flats and members when community changes
  useEffect(() => {
    if (selectedCommunity?.id) {
      fetchFlats(selectedCommunity.id);
      fetchMembers(selectedCommunity.id);
    }
  }, [selectedCommunity?.id, fetchFlats, fetchMembers]);

  // Fetch dashboard stats function
  const fetchDashboardStats = useCallback(async () => {
    if (!selectedCommunity?.id) return;
    
    let maintenanceCount = 0;
    let messagesCount = 0;
    let flatsUpdatesCount = 0;

    // Fetch maintenance requests - handle independently
    try {
      const maintenanceResponse = await backendClient.get(
        `/api/communities/${selectedCommunity.id}/maintenance`
      );
      
      console.log('Maintenance API response:', maintenanceResponse);

      let allRequests = [];
      if (maintenanceResponse.requests && Array.isArray(maintenanceResponse.requests)) {
        allRequests = maintenanceResponse.requests;
      } else if (maintenanceResponse.data && Array.isArray(maintenanceResponse.data)) {
        allRequests = maintenanceResponse.data;
      } else if (Array.isArray(maintenanceResponse)) {
        allRequests = maintenanceResponse;
      }

      // Count only open requests (not in_progress, not resolved)
      maintenanceCount = allRequests.filter(r => r.status === 'open').length;
      console.log('Open requests count:', maintenanceCount);
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
    }

    // Fetch unread messages count - handle independently
    try {
      const messagesResponse = await backendClient.get(
        `/api/communities/${selectedCommunity.id}/chat/unread-count`
      );
      messagesCount = messagesResponse.count || 0;
    } catch (error) {
      // Endpoint might not exist yet, ignore error
      console.log('Chat unread-count endpoint not available');
    }

    // Fetch flats with updates count - handle independently
    try {
      const flatsResponse = await backendClient.get(
        `/api/communities/${selectedCommunity.id}/flats/updates-count`
      );
      flatsUpdatesCount = flatsResponse.count || 0;
    } catch (error) {
      console.log('Flats updates-count endpoint not available');
    }

    setDashboardStats(prev => ({
      ...prev,
      activeRequests: maintenanceCount,
      newMessages: messagesCount,
      flatsWithUpdates: flatsUpdatesCount,
      pendingMembers: selectedCommunity?.stats?.pending || 0,
      pendingMeterReadings: 0
    }));
  }, [selectedCommunity?.id, selectedCommunity?.stats?.pending]);

  // Fetch dashboard stats when community changes
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!selectedCommunity?.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection
    initializeSocket(token);
    
    // Join community room
    joinCommunity(selectedCommunity.id);

    // Handler for real-time events
    const handleStatsUpdate = () => {
      console.log('Real-time stats update received');
      fetchDashboardStats();
      // Also refresh members to get updated pending count
      fetchMembers(selectedCommunity.id);
    };

    // Subscribe to all relevant events
    subscribe(EVENTS.NEW_MESSAGE, handleStatsUpdate);
    subscribe(EVENTS.MAINTENANCE_CREATED, handleStatsUpdate);
    subscribe(EVENTS.MAINTENANCE_UPDATED, handleStatsUpdate);
    subscribe(EVENTS.MEMBER_PENDING, handleStatsUpdate);
    subscribe(EVENTS.MEMBER_APPROVED, handleStatsUpdate);
    subscribe(EVENTS.STATS_UPDATED, handleStatsUpdate);
    subscribe(EVENTS.DOCUMENT_UPLOADED, handleStatsUpdate);
    subscribe(EVENTS.PAYMENT_CREATED, handleStatsUpdate);
    subscribe(EVENTS.PAYMENT_UPDATED, handleStatsUpdate);

    // Cleanup on unmount or community change
    return () => {
      unsubscribe(EVENTS.NEW_MESSAGE, handleStatsUpdate);
      unsubscribe(EVENTS.MAINTENANCE_CREATED, handleStatsUpdate);
      unsubscribe(EVENTS.MAINTENANCE_UPDATED, handleStatsUpdate);
      unsubscribe(EVENTS.MEMBER_PENDING, handleStatsUpdate);
      unsubscribe(EVENTS.MEMBER_APPROVED, handleStatsUpdate);
      unsubscribe(EVENTS.STATS_UPDATED, handleStatsUpdate);
      unsubscribe(EVENTS.DOCUMENT_UPLOADED, handleStatsUpdate);
      unsubscribe(EVENTS.PAYMENT_CREATED, handleStatsUpdate);
      unsubscribe(EVENTS.PAYMENT_UPDATED, handleStatsUpdate);
      leaveCommunity(selectedCommunity.id);
    };
  }, [selectedCommunity?.id, fetchDashboardStats, fetchMembers]);

  // Periodic polling every 15 minutes as fallback
  const intervalRef = useRef(null);
  useEffect(() => {
    if (!selectedCommunity?.id) return;

    // Set up 15-minute interval
    intervalRef.current = setInterval(() => {
      console.log('Periodic stats refresh (15 min)');
      fetchDashboardStats();
      fetchMembers(selectedCommunity.id);
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedCommunity?.id, fetchDashboardStats, fetchMembers]);

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  if (isLoading && !selectedCommunity) {
    return (
      <div className="min-h-screen bg-[#eeede7] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-[#3d5c3d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eeede7] flex flex-col">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex items-center justify-between py-2 min-h-[52px]">
          <div className="flex items-center gap-1.5">
            <p className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="text-[#0d0c07]">naaber</span>
              <span className="text-[#3d5c3d]">.ee</span>
            </p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.0001 3.625C14.7844 3.62518 17.0411 5.88267 17.0411 8.66699C17.041 10.2769 16.2853 11.7089 15.1104 12.6318C15.9294 13.0028 16.6841 13.5191 17.3321 14.167C18.7465 15.5813 19.5411 17.4998 19.5411 19.5C19.5411 19.9832 19.1493 20.375 18.6661 20.375C18.1831 20.3747 17.7911 19.983 17.7911 19.5C17.7911 17.964 17.181 16.4904 16.0948 15.4043C15.0088 14.3185 13.5358 13.7081 12.0001 13.708C10.4642 13.7081 8.99044 14.3183 7.90438 15.4043C6.81833 16.4904 6.20809 17.964 6.20809 19.5C6.20809 19.9832 5.81634 20.375 5.33309 20.375C4.84999 20.3748 4.45809 19.9831 4.45809 19.5C4.45809 17.4999 5.25284 15.5813 6.66708 14.167C7.31483 13.5193 8.06918 13.0028 8.88778 12.6318C7.71348 11.7088 6.95819 10.2765 6.95809 8.66699C6.95809 5.88267 9.2158 3.62518 12.0001 3.625ZM12.0001 5.375C10.1823 5.37518 8.70809 6.84916 8.70809 8.66699C8.70826 10.4278 10.0913 11.8657 11.8302 11.9541L12.0001 11.958L12.169 11.9541C13.9082 11.866 15.2909 10.428 15.2911 8.66699C15.2911 6.84916 13.8179 5.37518 12.0001 5.375Z" fill="#0D0C07"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-6">
        {/* Hero Block */}
        <div className="bg-gradient-to-b from-[#eeede7] to-[#fbfbf9] rounded-bl-3xl rounded-br-3xl shadow-sm border-b-2 border-white">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 flex flex-col gap-4">
            {/* Community Selector / Title Section */}
            {communities.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setShowCommunitySelector(!showCommunitySelector)}
                  className="flex items-center gap-2 w-full"
                >
                  <img 
                    src="/assets/residential-house.png" 
                    alt={selectedCommunity?.name}
                    className="w-24 h-24 rounded-md object-cover"
                  />
                  <div className="flex-1 text-left">
                    <h1 className="text-[22px] font-bold text-[#293d29] leading-8" style={{ fontFamily: "'Lora', serif" }}>
                      {selectedCommunity?.name}
                    </h1>
                    <p className="text-xs text-[#56554d] leading-5">
                      {selectedCommunity?.address}
                    </p>
                  </div>
                  <svg className={`w-5 h-5 text-[#56554d] transition-transform ${showCommunitySelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCommunitySelector && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-[#eeede7]">
                    {communities.map((community) => (
                      <button
                        key={community.id}
                        onClick={() => {
                          selectCommunity(community);
                          setShowCommunitySelector(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#f8f8f7] first:rounded-t-xl last:rounded-b-xl ${
                          selectedCommunity?.id === community.id ? 'bg-[#eeede7]' : ''
                        }`}
                      >
                        <p className="font-medium text-[#0d0c07]">{community.name}</p>
                        <p className="text-sm text-[#56554d]">{community.address}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/residential-house.png" 
                  alt={selectedCommunity?.name}
                  className="w-24 h-24 rounded-md object-cover"
                />
                <div className="flex-1">
                  <h1 className="text-[22px] font-bold text-[#293d29] leading-8" style={{ fontFamily: "'Lora', serif" }}>
                    {selectedCommunity?.name}
                  </h1>
                  <p className="text-xs text-[#56554d] leading-5">
                    {selectedCommunity?.address}
                  </p>
                </div>
              </div>
            )}

            {/* Add Flats Banner - show only if no flats */}
            {flats.length === 0 && (
              <button
                onClick={() => navigate('/flats')}
                className="bg-[#518C03]/10 rounded-xl p-4 flex flex-col gap-3 text-left hover:bg-[#518C03]/15 transition-colors"
              >
                <p className="text-[#293D29] text-base leading-6">
                  {t('president.addFlatsText')}
                </p>
                <div className="bg-[#293D29] border border-[#293D29] rounded-xl py-2.5 px-6 text-center">
                  <span className="text-white text-sm font-semibold leading-6">
                    {t('president.addFlats')}
                  </span>
                </div>
              </button>
            )}

            {/* Invite Residents Banner - show only if flats exist but no members/pending */}
            {flats.length > 0 && members.length === 0 && pendingMembers.length === 0 && (
              <button
                onClick={() => navigate('/members')}
                className="bg-[#518C03]/10 rounded-xl p-4 flex flex-col gap-3 text-left hover:bg-[#518C03]/15 transition-colors"
              >
                <p className="text-[#293D29] text-base leading-6">
                  {t('president.inviteResidentsText')}
                </p>
                <div className="bg-[#293D29] border border-[#293D29] rounded-xl py-2.5 px-6 text-center">
                  <span className="text-white text-sm font-semibold leading-6">
                    {t('president.inviteResidents')}
                  </span>
                </div>
              </button>
            )}

            {/* Stats Cards */}
            <div className="flex gap-4">
              {/* Requests Card */}
              <button
                onClick={() => navigate('/maintenance')}
                className="flex-1 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 relative min-w-[150px] text-left hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-2">
                  <div className="bg-[#e08700] h-8 min-w-[32px] w-fit rounded-md flex items-center justify-center px-2">
                    <span className="text-base font-semibold text-white leading-[30px]">
                      {dashboardStats.activeRequests}
                    </span>
                  </div>
                  <p className="text-sm text-[#4d4b42] leading-[22px]">{t('president.requests')}</p>
                </div>
                <svg className="absolute top-3 right-3 w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M4.16667 10H15.8333M15.8333 10L10 4.16667M15.8333 10L10 15.8333" 
                        stroke="#878683" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Messages Card */}
              <button
                onClick={() => navigate('/chat')}
                className="flex-1 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 relative min-w-[150px] text-left hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-2">
                  <div className="bg-[#3d5c3d] h-8 min-w-[32px] w-fit rounded-md flex items-center justify-center px-2">
                    <span className="text-base font-semibold text-white leading-[30px]">
                      {dashboardStats.newMessages}
                    </span>
                  </div>
                  <p className="text-sm text-[#4d4b42] leading-[22px]">{t('president.newMessages')}</p>
                </div>
                <svg className="absolute top-3 right-3 w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M4.16667 10H15.8333M15.8333 10L10 4.16667M15.8333 10L10 15.8333" 
                        stroke="#878683" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 mt-6 flex flex-col gap-4">
          {/* Announcements */}
          <button
            onClick={() => navigate('/announcements')}
            className="bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex items-center gap-3 hover:bg-white transition-colors text-left"
          >
            <div className="bg-[#eeede7] w-12 h-12 rounded-md flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 14C6 16.5964 6.84213 19.1228 8.4 21.2C8.71826 21.6243 9.19206 21.9049 9.71716 21.9799C10.2423 22.0549 10.7757 21.9183 11.2 21.6C11.6243 21.2817 11.9049 20.8079 11.9799 20.2828C12.0549 19.7577 11.9183 19.2243 11.6 18.8C10.5614 17.4152 10 15.731 10 14M8 6V14M11 6C14.0414 6.07835 17.0139 5.0875 19.4 3.2C19.5486 3.08857 19.7252 3.02072 19.9102 3.00404C20.0952 2.98736 20.2811 3.02252 20.4472 3.10557C20.6133 3.18863 20.753 3.31629 20.8507 3.47427C20.9483 3.63224 21 3.81429 21 4V16C21 16.1857 20.9483 16.3678 20.8507 16.5257C20.753 16.6837 20.6133 16.8114 20.4472 16.8944C20.2811 16.9775 20.0952 17.0126 19.9102 16.996C19.7252 16.9793 19.5486 16.9114 19.4 16.8C17.0139 14.9125 14.0414 13.9217 11 14H5C4.46957 14 3.96086 13.7893 3.58579 13.4142C3.21071 13.0391 3 12.5304 3 12V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11Z" 
                      stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[15.2px] text-[#0d0c07] leading-6">{t('president.announcements')}</span>
          </button>

          {/* Events */}
          <button
            onClick={() => navigate('/events')}
            className="bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex items-center gap-3 hover:bg-white transition-colors text-left"
          >
            <div className="bg-[#eeede7] w-12 h-12 rounded-md flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" 
                      stroke="#0D0C07" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[15.2px] text-[#0d0c07] leading-6">{t('president.events')}</span>
          </button>

          {/* Meters */}
          <button
            onClick={() => navigate('/meters')}
            className="bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#eeede7] w-12 h-12 rounded-md flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 14C3.81077 14.0006 3.62523 13.9476 3.46495 13.847C3.30468 13.7464 3.17623 13.6024 3.09455 13.4317C3.01287 13.261 2.98129 13.0706 3.0035 12.8827C3.02571 12.6947 3.10078 12.517 3.22 12.37L13.12 2.17C13.1943 2.08428 13.2955 2.02636 13.407 2.00573C13.5185 1.98511 13.6337 2.00301 13.7337 2.0565C13.8337 2.11 13.9126 2.1959 13.9573 2.30011C14.0021 2.40432 14.0101 2.52065 13.98 2.63L12.06 8.65C12.0034 8.80152 11.9844 8.96452 12.0046 9.12501C12.0248 9.28549 12.0837 9.43868 12.1761 9.57143C12.2685 9.70417 12.3918 9.81251 12.5353 9.88716C12.6788 9.96181 12.8382 10.0005 13 10H20C20.1892 9.99935 20.3748 10.0524 20.535 10.153C20.6953 10.2536 20.8238 10.3976 20.9055 10.5683C20.9871 10.739 21.0187 10.9294 20.9965 11.1173C20.9743 11.3053 20.8992 11.483 20.78 11.63L10.88 21.83C10.8057 21.9157 10.7045 21.9736 10.593 21.9943C10.4815 22.0149 10.3663 21.997 10.2663 21.9435C10.1663 21.89 10.0874 21.8041 10.0427 21.6999C9.99791 21.5957 9.98992 21.4794 10.02 21.37L11.94 15.35C11.9966 15.1985 12.0156 15.0355 11.9954 14.875C11.9752 14.7145 11.9163 14.5613 11.8239 14.4286C11.7315 14.2958 11.6082 14.1875 11.4647 14.1128C11.3212 14.0382 11.1618 13.9995 11 14H4Z" 
                        stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[15.2px] text-[#0d0c07] leading-6">{t('president.meters')}</span>
            </div>
            {dashboardStats.pendingMeterReadings > 0 && (
              <span className="bg-[#b50b0b] text-[#eeede7] text-xs leading-5 min-w-[20px] px-1.5 rounded-full font-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {dashboardStats.pendingMeterReadings}
              </span>
            )}
          </button>

          {/* Two Column Grid - Flats & Residents */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/flats')}
              className="flex-1 bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-colors min-w-[140px] relative"
            >
              <div className="bg-[#e5e3dc] w-12 h-12 rounded-md flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 10H12.01M12 14H12.01M12 6H12.01M16 10H16.01M16 14H16.01M16 6H16.01M8 10H8.01M8 14H8.01M8 6H8.01M9 22V19C9 18.7348 9.10536 18.4804 9.29289 18.2929C9.48043 18.1054 9.73478 18 10 18H14C14.2652 18 14.5196 18.1054 14.7071 18.2929C14.8946 18.4804 15 18.7348 15 19V22M6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" 
                        stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[15.2px] text-[#0d0c07] leading-6 text-center w-24">{t('president.flats')}</p>
              {dashboardStats.flatsWithUpdates > 0 && (
                <span className="absolute top-2 right-12 bg-[#b50b0b] text-[#eeede7] text-xs leading-5 min-w-[20px] px-1.5 rounded-full font-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {dashboardStats.flatsWithUpdates}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/members')}
              className="flex-1 bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-colors min-w-[140px] relative"
            >
              <div className="bg-[#e5e3dc] w-12 h-12 rounded-md flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 21C18 18.8783 17.1571 16.8434 15.6569 15.3431C14.1566 13.8429 12.1217 13 10 13M10 13C7.87827 13 5.84344 13.8429 4.34315 15.3431C2.84285 16.8434 2 18.8783 2 21M10 13C12.7614 13 15 10.7614 15 8C15 5.23858 12.7614 3 10 3C7.23858 3 5 5.23858 5 8C5 10.7614 7.23858 13 10 13ZM22 20C22 16.63 20 13.5 18 12C18.6574 11.5068 19.1831 10.8591 19.5306 10.1143C19.878 9.36945 20.0365 8.55047 19.992 7.7298C19.9475 6.90913 19.7014 6.11209 19.2755 5.4092C18.8495 4.70631 18.2569 4.11926 17.55 3.7" 
                        stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[15.2px] text-[#0d0c07] leading-6 text-center w-24">{t('president.residents')}</p>
              {dashboardStats.pendingMembers > 0 && (
                <span className="absolute top-2 right-12 bg-[#b50b0b] text-[#eeede7] text-xs leading-5 min-w-[20px] px-1.5 rounded-full font-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {dashboardStats.pendingMembers}
                </span>
              )}
            </button>
          </div>

          {/* Two Column Grid - Documents & Payments */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="flex-1 bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-colors min-w-[140px]"
            >
              <div className="bg-[#e5e3dc] w-12 h-12 rounded-md flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8M14 2C14.3166 1.99949 14.6301 2.0616 14.9225 2.18277C15.215 2.30394 15.4806 2.48176 15.704 2.706L19.292 6.294C19.5168 6.51751 19.6952 6.78335 19.8167 7.07616C19.9382 7.36898 20.0005 7.68297 20 8M14 2V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8L20 8M10 9H8M16 13H8M16 17H8" 
                        stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[15.2px] text-[#0d0c07] leading-6 text-center w-24">{t('president.documents')}</p>
            </button>

            <button
              onClick={() => navigate('/payments')}
              className="flex-1 bg-[#F8F8F7] rounded-xl border border-white shadow-[0px_1px_2px_0px_rgba(35,33,22,0.02),2px_6px_12px_0px_rgba(83,81,69,0.06)] p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-colors min-w-[140px]"
            >
              <div className="bg-[#e5e3dc] w-12 h-12 rounded-md flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M2 10H22M4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7C2 5.89543 2.89543 5 4 5Z" 
                        stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[15.2px] text-[#0d0c07] leading-6 text-center">{t('president.payments')}</p>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-4 flex justify-center gap-6 text-sm">
        <button onClick={() => {}} className="text-[#0d0c07] hover:underline">{t('common:footer.privacy')}</button>
        <button onClick={() => {}} className="text-[#0d0c07] hover:underline">{t('common:footer.terms')}</button>
        <button onClick={() => {}} className="text-[#0d0c07] hover:underline">{t('common:footer.contact')}</button>
      </footer>
    </div>
  );
};

export default PresidentDashboard;
