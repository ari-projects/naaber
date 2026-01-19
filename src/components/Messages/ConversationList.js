import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const ConversationList = () => {
  const { t } = useTranslation(['messages', 'common']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [flats, setFlats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Natural sort function for flat numbers (1, 2, 3... instead of 1, 10, 11...)
  const naturalSort = (a, b) => {
    return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const convResponse = await backendClient.get('/api/messages/conversations');
        if (convResponse.success) {
          setConversations(convResponse.conversations);
        }
        const communityId = user?.community?._id || user?.community?.id || user?.communityId;
        if (communityId) {
          const flatsResponse = await backendClient.get(`/api/communities/${communityId}/flats`);
          if (flatsResponse.success) {
            const myFlatId = user?.flat?._id || user?.flat?.id || user?.flatId;
            setFlats(flatsResponse.flats.filter(f => f.id !== myFlatId).sort(naturalSort));
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return t('common:time.yesterday');
    if (diffDays < 7) return t('common:time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const startConversation = (flatId) => {
    navigate(`/messages/${flatId}`);
    setShowNewMessage(false);
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
              <button onClick={() => navigate('/home')} className="mr-4 text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-10">{t('title')}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowNewMessage(true)} className="p-2 text-brand-secondary hover:bg-brand-primary/30 rounded-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button onClick={logout} className="text-ui-error hover:text-ui-error-hover text-sm font-medium">
                {t('common:navigation.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-large-s sm:px-6 lg:px-8 py-6">
        {!user?.flat && (
          <div className="mb-6 p-medium-m bg-ui-warning/20 rounded-inner">
            <p className="text-sm text-ui-warning">{t('noFlatAssigned')}</p>
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-7">{t('noConversations')}</p>
            <button onClick={() => setShowNewMessage(true)} className="mt-4 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover">
              {t('startNew')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.flatId}
                onClick={() => navigate(`/messages/${conv.flatId}`)}
                className="w-full bg-gray-0 rounded-outer shadow-sm p-medium-m flex items-center hover:shadow-md transition-shadow text-left"
              >
                <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-brand-secondary font-semibold">{conv.flatNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-10">{t('common:labels.flat')} {conv.flatNumber}</span>
                    <span className="text-xs text-gray-7">{formatTime(conv.lastMessage.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-7 truncate">
                    {conv.lastMessage.isFromMe && <span className="text-gray-10">{t('you')}: </span>}
                    {conv.lastMessage.content}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="ml-3 w-6 h-6 bg-brand-secondary rounded-full flex items-center justify-center">
                    <span className="text-gray-0 text-xs font-medium">{conv.unreadCount}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {showNewMessage && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-medium-m">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-medium-m border-b border-gray-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-10">{t('selectFlat')}</h3>
              <button onClick={() => setShowNewMessage(false)} className="text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-medium-m max-h-96 overflow-y-auto">
              {flats.length === 0 ? (
                <p className="text-center text-gray-7 py-medium-m">{t('noOtherFlats')}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[...flats].sort(naturalSort).map((flat) => (
                    <button
                      key={flat.id}
                      onClick={() => startConversation(flat.id)}
                      className="p-medium-s bg-gray-025 rounded-inner hover:bg-brand-primary/30 hover:text-brand-secondary transition-colors"
                    >
                      <span className="font-medium">{flat.number}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
