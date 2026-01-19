import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCommunity } from '../../contexts/CommunityContext';
import InviteQRPrint from './InviteQRPrint';

const MemberManagement = () => {
  const { t } = useTranslation(['community', 'common']);
  const {
    selectedCommunity,
    members,
    pendingMembers,
    fetchMembers,
    fetchPendingMembers,
    approveMember,
    rejectMember,
    removeMember,
    isLoading
  } = useCommunity();
  const navigate = useNavigate();
  const location = useLocation();

  const isPendingRoute = location.pathname.includes('pending');
  const [activeTab, setActiveTab] = useState(isPendingRoute ? 'pending' : 'all');
  const [actionLoading, setActionLoading] = useState(null);
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [showEmailInviteDrawer, setShowEmailInviteDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQRPrint, setShowQRPrint] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (selectedCommunity?.id) {
      fetchMembers(selectedCommunity.id);
      fetchPendingMembers(selectedCommunity.id);
    }
  }, [selectedCommunity, fetchMembers, fetchPendingMembers]);

  const handleApprove = async (memberId, memberName) => {
    if (window.confirm(t('members.approveConfirm', { name: memberName }))) {
      setActionLoading(memberId);
      await approveMember(memberId);
      setActionLoading(null);
    }
  };

  const handleReject = async (memberId, memberName) => {
    if (window.confirm(t('members.rejectConfirm', { name: memberName }))) {
      setActionLoading(memberId);
      await rejectMember(memberId);
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteDrawer(true);
  };

  const confirmRemove = async () => {
    if (!memberToDelete) return;
    setActionLoading(memberToDelete.id);
    await removeMember(memberToDelete.id);
    setActionLoading(null);
    setShowDeleteDrawer(false);
    setMemberToDelete(null);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/register/member/${selectedCommunity?.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePrintQR = () => {
    setShowQRPrint(true);
    // Даём время на рендеринг компонента, затем печатаем
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Check if there are no members at all (for empty state)
  const hasNoMembers = members.length === 0 && pendingMembers.length === 0;

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${member.name} ${member.surname}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    const flat = member.flat?.number?.toString() || '';
    return fullName.includes(query) || email.includes(query) || flat.includes(query);
  });

  const filteredPendingMembers = pendingMembers.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${member.name} ${member.surname}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    const flat = member.flat?.number?.toString() || '';
    return fullName.includes(query) || email.includes(query) || flat.includes(query);
  });

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
            {t('members.title')}
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
        </div>
      </header>

      {/* Empty State - No members at all */}
      {!isLoading && hasNoMembers ? (
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 pb-6">
          {/* Invite Card */}
          <div 
            className="rounded-2xl border border-white bg-[#F8F8F7] p-6 mb-4"
            style={{
              boxShadow: '0 1px 2px 0 rgba(35, 33, 22, 0.02), 2px 6px 12px 0 rgba(83, 81, 69, 0.06)'
            }}
          >
            <p className="text-base text-[#0D0C07] mb-6 leading-relaxed">
              {t('members.emptyState.description')}
            </p>
            
            {/* Family illustration */}
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/invite-members.png" 
                alt="" 
                className="h-40 object-contain"
              />
            </div>

            {/* Action buttons */}
            <button
              onClick={() => setShowEmailInviteDrawer(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#293D29] text-white rounded-xl font-semibold text-sm hover:bg-[#1e2e1e] transition-colors mb-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('members.inviteByEmail')}
            </button>

            <button
              onClick={handlePrintQR}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#E5E3DC] text-[#0D0C07] rounded-xl font-semibold text-sm hover:bg-[#d5d3cc] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('members.printQRCode')}
            </button>
          </div>

          {/* Share Link Card */}
          <div 
            className="rounded-2xl border border-white bg-[#F8F8F7] p-6"
            style={{
              boxShadow: '0 1px 2px 0 rgba(35, 33, 22, 0.02), 2px 6px 12px 0 rgba(83, 81, 69, 0.06)'
            }}
          >
            <p className="text-sm text-[#0D0C07] mb-4">
              {t('members.shareLinkDescription')}
            </p>
            
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E5E3DC]">
              <p className="flex-1 text-sm text-[#0D0C07] truncate">
                {window.location.origin}/register/member/{selectedCommunity?.id}
              </p>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center w-10 h-10 bg-[#EBEBEA] rounded-lg hover:bg-[#E5E3DC] transition-colors"
              >
                {linkCopied ? (
                  <svg className="w-5 h-5 text-[#293D29]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#0D0C07]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tab Bar */}
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 pb-6">
            <div className="bg-[#E5E3DC] flex gap-3 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-[10px] font-semibold text-xs leading-5 text-[#0D0C07] transition-colors ${
                  activeTab === 'all' ? 'bg-white' : ''
                }`}
              >
                {t('members.tabs.all')}
              </button>
              
              <button 
                onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-[10px] font-semibold text-xs leading-5 text-[#0D0C07] transition-colors ${
              activeTab === 'pending' ? 'bg-white' : ''
            }`}
          >
            {t('members.tabs.pending')}
            {pendingMembers.length > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#B50B0B] text-white text-xs font-semibold rounded-full">
                {pendingMembers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-[#56554D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending Members Tab */
          filteredPendingMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#EBEBEA] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#56554D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#0D0C07] font-semibold text-sm mb-1">{t('members.noPending')}</p>
              <p className="text-xs text-[#56554D]">{t('members.noPendingSubtitle')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPendingMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="relative rounded-xl border border-white bg-[#F8F8F7] p-4"
                  style={{
                    boxShadow: '0 1px 2px 0 rgba(35, 33, 22, 0.02), 2px 6px 12px 0 rgba(83, 81, 69, 0.06)'
                  }}
                >
                  {member.flat?.number && (
                    <span 
                      className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium text-[#0D0C07]"
                      style={{
                        background: '#EBEBEA',
                        backdropFilter: 'blur(16px)'
                      }}
                    >
                      {t('common:labels.flat')} {member.flat.number}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3 pr-20">
                    <p className="font-semibold text-sm text-[#0D0C07]">
                      {member.name} {member.surname}
                    </p>
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      className="text-[#56554D] hover:text-[#0D0C07]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-xs text-[#56554D] mb-4">
                    {member.email}
                    {member.phone && (
                      <>
                        <span className="mx-2">•</span>
                        {member.phone}
                      </>
                    )}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(member.id, member.name)}
                      disabled={actionLoading === member.id}
                      className="flex-1 py-2.5 bg-[#E5E3DC] text-[#0D0C07] text-sm font-semibold rounded-xl hover:bg-[#d5d3cc] disabled:opacity-50 transition-colors"
                    >
                      {t('members.reject')}
                    </button>
                    <button
                      onClick={() => handleApprove(member.id, member.name)}
                      disabled={actionLoading === member.id}
                      className="flex-1 py-2.5 bg-[#293D29] text-white text-sm font-semibold rounded-xl hover:bg-[#1e2e1e] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === member.id ? (
                        <svg className="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : t('members.approve')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* All Members Tab */
          filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#EBEBEA] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#56554D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-[#0D0C07] font-semibold text-sm mb-1">{t('members.noMembers')}</p>
              <p className="text-xs text-[#56554D]">{t('members.noMembersSubtitle')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="relative rounded-xl border border-white bg-[#F8F8F7] p-4 md:p-5"
                  style={{
                    boxShadow: '0 1px 2px 0 rgba(35, 33, 22, 0.02), 2px 6px 12px 0 rgba(83, 81, 69, 0.06)'
                  }}
                >
                  {member.flat?.number && (
                    <span 
                      className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium text-[#0D0C07]"
                      style={{
                        background: '#EBEBEA',
                        backdropFilter: 'blur(16px)'
                      }}
                    >
                      {t('common:labels.flat')} {member.flat.number}
                    </span>
                  )}
                  <div className={member.flat?.number ? 'pr-24' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold md:text-[15.2px] pb-1 text-sm text-[#0D0C07]">
                        {member.name} {member.surname}
                      </p>
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        disabled={actionLoading === member.id}
                        className="text-[#56554D] hover:text-[#B50B0B] transition-colors"
                      >
                        {actionLoading === member.id ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs md:text-[12.8px] text-[#4D4B42]">
                      {member.email}
                      {member.phone && (
                        <>
                          <span className="mx-2 text-[#C1C0BE]">•</span>
                          {member.phone}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Bottom Floating Button - Invite Members */}
      {!hasNoMembers && (
        <div 
          className="fixed left-0 right-0 z-50 px-6"
          style={{ 
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div className="max-w-[1280px] mx-auto">
            <div 
              className="p-2 rounded-2xl"
              style={{
                border: '1px solid #FFF',
                background: 'rgba(255, 255, 255, 0.60)',
                boxShadow: '0 0 1px 0 rgba(13, 12, 7, 0.12), 0 -4px 24px 0 rgba(13, 12, 7, 0.12), 1px -2px 8px 0 rgba(13, 12, 7, 0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <button
                onClick={() => setShowInviteDrawer(true)}
                className="w-full bg-[#0D0C07] text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-[#1a1a1a] transition-colors"
              >
                {t('members.inviteMembers')}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Search Drawer */}
      {showSearchDrawer && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSearchDrawer(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 animate-slide-up">
            <div className="w-12 h-1 bg-[#E5E3DC] rounded-full mx-auto mb-6" />
            <h2 className="font-['Lora'] font-bold text-lg text-[#0D0C07] mb-4">
              {t('members.search')}
            </h2>
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#56554D]" fill="none" viewBox="0 0 24 24">
                <path d="M11.1671 3.625C15.3321 3.62518 18.7081 7.00195 18.7081 11.167C18.708 12.9341 18.0981 14.5572 17.0802 15.8428L20.1192 18.8809C20.4609 19.2226 20.4609 19.7774 20.1192 20.1191C19.7775 20.4609 19.2227 20.4608 18.8809 20.1191L15.8429 17.0801C14.5573 18.098 12.9341 18.7079 11.1671 18.708C7.00204 18.708 3.62526 15.332 3.62508 11.167C3.62508 7.00185 7.00193 3.625 11.1671 3.625ZM11.1671 5.375C7.96843 5.375 5.37508 7.96834 5.37508 11.167C5.37526 14.3655 7.96853 16.958 11.1671 16.958C14.3655 16.9578 16.9579 14.3654 16.9581 11.167C16.9581 7.96845 14.3656 5.37518 11.1671 5.375Z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('members.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-[#EEEDE7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#293D29]/30"
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                setShowSearchDrawer(false);
              }}
              className="w-full py-3 bg-[#293D29] text-white rounded-xl font-semibold text-sm"
            >
              {t('common:actions.search')}
            </button>
          </div>
        </div>
      )}

      {/* Invite Drawer (placeholder) */}
      {showInviteDrawer && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowInviteDrawer(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#F8F8F7] rounded-t-3xl p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-1 bg-[#E5E3DC] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <div className="flex-1" />
              <button 
                onClick={() => setShowInviteDrawer(false)}
                className="text-[#56554D] hover:text-[#0D0C07]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="font-['Lora'] font-bold text-xl text-[#0D0C07] mb-2">
              {t('members.inviteMembers')}
            </h2>
            <p className="text-sm text-[#56554D] mb-6">
              {t('members.emailInviteDescription')}
            </p>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="email@email.com, email@email.com"
              className="w-full h-40 p-4 bg-white border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#293D29]/30 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteDrawer(false)}
                className="flex-1 py-3 bg-[#E5E3DC] text-[#0D0C07] rounded-xl font-semibold text-sm hover:bg-[#d5d3cc] transition-colors"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                onClick={() => {
                  // TODO: Send invite emails
                  setShowInviteDrawer(false);
                  setInviteEmails('');
                }}
                className="flex-1 py-3 bg-[#293D29] text-white rounded-xl font-semibold text-sm hover:bg-[#1e2e1e] transition-colors"
              >
                {t('members.invite')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Invite Drawer */}
      {showEmailInviteDrawer && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEmailInviteDrawer(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#F8F8F7] rounded-t-3xl p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-1 bg-[#E5E3DC] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <div className="flex-1" />
              <button 
                onClick={() => setShowEmailInviteDrawer(false)}
                className="text-[#56554D] hover:text-[#0D0C07]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="font-['Lora'] font-bold text-xl text-[#0D0C07] mb-2">
              {t('members.inviteMembers')}
            </h2>
            <p className="text-sm text-[#56554D] mb-6">
              {t('members.emailInviteDescription')}
            </p>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="email@email.com, email@email.com"
              className="w-full h-40 p-4 bg-white border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#293D29]/30 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailInviteDrawer(false)}
                className="flex-1 py-3 bg-[#E5E3DC] text-[#0D0C07] rounded-xl font-semibold text-sm hover:bg-[#d5d3cc] transition-colors"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                onClick={() => {
                  // TODO: Send invite emails
                  setShowEmailInviteDrawer(false);
                  setInviteEmails('');
                }}
                className="flex-1 py-3 bg-[#293D29] text-white rounded-xl font-semibold text-sm hover:bg-[#1e2e1e] transition-colors"
              >
                {t('members.invite')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Drawer */}
      {showDeleteDrawer && memberToDelete && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowDeleteDrawer(false);
              setMemberToDelete(null);
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#F8F8F7] rounded-t-3xl p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-1 bg-[#E5E3DC] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <div className="flex-1" />
              <button 
                onClick={() => {
                  setShowDeleteDrawer(false);
                  setMemberToDelete(null);
                }}
                className="text-[#56554D] hover:text-[#0D0C07]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="font-['Lora'] font-bold text-xl text-[#0D0C07] mb-6">
              {t('members.deleteConfirmTitle')}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDrawer(false);
                  setMemberToDelete(null);
                }}
                className="flex-1 py-3 bg-[#E5E3DC] text-[#0D0C07] rounded-xl font-semibold text-sm hover:bg-[#d5d3cc] transition-colors"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                onClick={confirmRemove}
                disabled={actionLoading === memberToDelete.id}
                className="flex-1 py-3 bg-[#B50B0B] text-white rounded-xl font-semibold text-sm hover:bg-[#9a0909] disabled:opacity-50 transition-colors"
              >
                {actionLoading === memberToDelete.id ? (
                  <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : t('common:actions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      {showQRPrint && (
        <div className="hidden print:block">
          <InviteQRPrint
            ref={printRef}
            inviteLink={`${window.location.origin}/register/member/${selectedCommunity?.id}`}
            communityName={selectedCommunity?.name}
            communityAddress={selectedCommunity?.address}
          />
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberManagement;
