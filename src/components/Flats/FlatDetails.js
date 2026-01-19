import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunity } from '../../contexts/CommunityContext';
import backendClient from '../../services/backendClient';

const FlatDetails = () => {
  const { t } = useTranslation(['community', 'common', 'messages', 'maintenance', 'payments', 'documents']);
  const { flatId } = useParams();
  const { logout } = useAuth();
  const { selectedCommunity, flats, members, fetchFlats, fetchMembers } = useCommunity();
  const navigate = useNavigate();

  const [flat, setFlat] = useState(null);
  const [flatMembers, setFlatMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch flat info
        if (flats.length === 0 && selectedCommunity?.id) {
          await fetchFlats(selectedCommunity.id);
        }
        
        // Fetch members
        if (members.length === 0 && selectedCommunity?.id) {
          await fetchMembers(selectedCommunity.id);
        }

        // Fetch flat-specific data
        const [messagesRes, paymentsRes, documentsRes, maintenanceRes] = await Promise.all([
          backendClient.get(`/api/flats/${flatId}/messages`).catch(() => ({ success: false })),
          backendClient.get(`/api/flats/${flatId}/payments`).catch(() => ({ success: false })),
          backendClient.get(`/api/flats/${flatId}/documents`).catch(() => ({ success: false })),
          backendClient.get(`/api/flats/${flatId}/maintenance`).catch(() => ({ success: false })),
        ]);

        if (messagesRes.success) setMessages(messagesRes.messages || []);
        if (paymentsRes.success) setPayments(paymentsRes.payments || []);
        if (documentsRes.success) setDocuments(documentsRes.documents || []);
        if (maintenanceRes.success) setMaintenanceRequests(maintenanceRes.requests || []);

      } catch (err) {
        console.error('Failed to fetch flat details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (flatId) {
      fetchData();
    }
  }, [flatId, selectedCommunity, flats.length, members.length, fetchFlats, fetchMembers]);

  useEffect(() => {
    // Find flat and its members
    const currentFlat = flats.find(f => f.id === flatId || f._id === flatId);
    setFlat(currentFlat);
    
    const flatMembersList = members.filter(m => 
      m.flatId === flatId || m.flat?.id === flatId || m.flat?._id === flatId || m.flat === flatId
    );
    setFlatMembers(flatMembersList);
  }, [flatId, flats, members]);

  const getUnreadCount = (items, field = 'read') => {
    return items.filter(item => !item[field]).length;
  };

  const getPendingPaymentsCount = () => {
    return payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;
  };

  const getOpenMaintenanceCount = () => {
    return maintenanceRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return t('common:time.yesterday');
    if (diffDays < 7) return t('common:time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const tabs = [
    { id: 'overview', label: t('flats.details.overview'), icon: 'info' },
    { id: 'residents', label: t('flats.details.residents'), icon: 'users', count: flatMembers.length },
    { id: 'messages', label: t('flats.details.messages'), icon: 'message', count: getUnreadCount(messages) },
    { id: 'payments', label: t('flats.details.payments'), icon: 'payment', count: getPendingPaymentsCount() },
    { id: 'documents', label: t('flats.details.documents'), icon: 'document', count: getUnreadCount(documents, 'reviewed') },
    { id: 'maintenance', label: t('flats.details.maintenance'), icon: 'maintenance', count: getOpenMaintenanceCount() },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-ui-error/20 text-ui-error';
      case 'in_progress': return 'bg-ui-warning/20 text-ui-warning';
      case 'resolved': case 'paid': return 'bg-ui-success/20 text-ui-success';
      case 'pending': return 'bg-ui-warning/20 text-ui-warning';
      case 'overdue': return 'bg-ui-error/20 text-ui-error';
      default: return 'bg-gray-1 text-gray-7';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-025 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-brand-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-025">
      <header className="bg-gray-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate('/flats')} className="mr-4 text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-10">
                  {t('flats.details.title', { number: flat?.number || flatId })}
                </h1>
                {selectedCommunity && (
                  <p className="text-sm text-gray-7">{selectedCommunity.name}</p>
                )}
              </div>
            </div>
            <button onClick={logout} className="text-ui-error hover:text-ui-error-hover text-sm font-medium">
              {t('common:navigation.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-0 rounded-inner shadow-sm p-medium-m">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-brand-primary/30 rounded-inner flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-10">{flatMembers.length}</p>
                <p className="text-xs text-gray-7">{t('flats.details.residents')}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-0 rounded-inner shadow-sm p-medium-m">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-inner flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-10">{messages.length}</p>
                <p className="text-xs text-gray-7">{t('flats.details.messages')}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-0 rounded-inner shadow-sm p-medium-m">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-inner flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-10">{payments.length}</p>
                <p className="text-xs text-gray-7">{t('flats.details.payments')}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-0 rounded-inner shadow-sm p-medium-m">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-inner flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-10">{maintenanceRequests.length}</p>
                <p className="text-xs text-gray-7">{t('flats.details.maintenance')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8">
        <div className="bg-gray-0 rounded-outer shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-medium-m py-medium-s text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-brand-secondary border-b-2 border-brand-secondary'
                    : 'text-gray-7 hover:text-gray-10'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-brand-secondary text-gray-0 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-medium-m">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="p-medium-m bg-gray-025 rounded-inner">
                  <h3 className="font-semibold text-gray-10 mb-2">{t('flats.details.flatInfo')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-7">{t('flats.flatNumber')}</p>
                      <p className="font-medium text-gray-10">{flat?.number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-7">{t('flats.details.residents')}</p>
                      <p className="font-medium text-gray-10">{flatMembers.length}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Activity Summary */}
                <div>
                  <h3 className="font-semibold text-gray-10 mb-3">{t('flats.details.recentActivity')}</h3>
                  <div className="space-y-2">
                    {messages.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-inner">
                        <span className="text-sm text-gray-10">{t('flats.details.unreadMessages', { count: getUnreadCount(messages) })}</span>
                        <button onClick={() => setActiveTab('messages')} className="text-sm text-brand-secondary font-medium">
                          {t('common:actions.view')}
                        </button>
                      </div>
                    )}
                    {getPendingPaymentsCount() > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-inner">
                        <span className="text-sm text-gray-10">{t('flats.details.pendingPayments', { count: getPendingPaymentsCount() })}</span>
                        <button onClick={() => setActiveTab('payments')} className="text-sm text-brand-secondary font-medium">
                          {t('common:actions.view')}
                        </button>
                      </div>
                    )}
                    {getOpenMaintenanceCount() > 0 && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-inner">
                        <span className="text-sm text-gray-10">{t('flats.details.openMaintenance', { count: getOpenMaintenanceCount() })}</span>
                        <button onClick={() => setActiveTab('maintenance')} className="text-sm text-brand-secondary font-medium">
                          {t('common:actions.view')}
                        </button>
                      </div>
                    )}
                    {messages.length === 0 && payments.length === 0 && maintenanceRequests.length === 0 && (
                      <p className="text-sm text-gray-7 text-center py-4">{t('flats.details.noActivity')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Residents Tab */}
            {activeTab === 'residents' && (
              <div>
                {flatMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-4 text-gray-7">{t('flats.details.noResidents')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flatMembers.map((member) => (
                      <div key={member.id || member._id} className="flex items-center justify-between p-3 bg-gray-025 rounded-inner">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-brand-primary/30 rounded-full flex items-center justify-center mr-3">
                            <span className="text-brand-secondary font-semibold">
                              {member.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-10">{member.name}</p>
                            <p className="text-xs text-gray-7">{member.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-7">
                          {t('members.memberSince', { date: formatDate(member.createdAt) })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="mt-4 text-gray-7">{t('flats.details.noMessages')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.slice(0, 10).map((message) => (
                      <div key={message.id || message._id} className={`p-3 rounded-inner ${message.read ? 'bg-gray-025' : 'bg-blue-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-10 text-sm">{message.senderName || t('flats.details.unknownSender')}</p>
                          <span className="text-xs text-gray-7">{formatTime(message.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-7 line-clamp-2">{message.content}</p>
                      </div>
                    ))}
                    {messages.length > 10 && (
                      <button 
                        onClick={() => navigate(`/messages/${flatId}`)}
                        className="w-full text-center py-2 text-sm text-brand-secondary font-medium"
                      >
                        {t('common:actions.viewAll')} ({messages.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-gray-7">{t('flats.details.noPayments')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id || payment._id} className="flex items-center justify-between p-3 bg-gray-025 rounded-inner">
                        <div>
                          <p className="font-medium text-gray-10">{payment.description}</p>
                          <p className="text-xs text-gray-7">{t('payments:dueDate')}: {formatDate(payment.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-10">€{payment.amount?.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(payment.status)}`}>
                            {t(`payments:status.${payment.status}`)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-4 text-gray-7">{t('flats.details.noDocuments')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id || doc._id} className="flex items-center justify-between p-3 bg-gray-025 rounded-inner">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-1 rounded-inner flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-gray-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-10">{doc.title}</p>
                            <p className="text-xs text-gray-7">{formatDate(doc.createdAt)}</p>
                          </div>
                        </div>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-secondary font-medium">
                            {t('common:actions.download')}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div>
                {maintenanceRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="mt-4 text-gray-7">{t('flats.details.noMaintenance')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {maintenanceRequests.map((request) => (
                      <div key={request.id || request._id} className="p-3 bg-gray-025 rounded-inner">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-10">{request.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(request.status)}`}>
                            {t(`maintenance:status.${request.status}`)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-7 line-clamp-2">{request.description}</p>
                        <p className="text-xs text-gray-7 mt-2">{formatDate(request.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlatDetails;
