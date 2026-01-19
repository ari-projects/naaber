import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const CommunityChat = () => {
  const { t } = useTranslation(['chat', 'common']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [communityId, setCommunityId] = useState(null);
  const [community, setCommunity] = useState(null);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastMessageTimeRef = useRef(null);

  // Get community ID based on user role
  useEffect(() => {
    const getCommunityId = async () => {
      if (user?.role === 'president') {
        // Fetch president's communities
        try {
          const response = await backendClient.get('/api/communities');
          if (response.success && response.communities.length > 0) {
            setCommunityId(response.communities[0].id);
            setCommunity(response.communities[0]);
          }
        } catch (err) {
          console.error('Failed to fetch communities:', err);
        }
      } else if (user?.community) {
        setCommunityId(user.community._id || user.community.id);
        setCommunity(user.community);
      }
    };

    getCommunityId();
  }, [user]);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!communityId) return;

    try {
      const response = await backendClient.get(`/api/communities/${communityId}/chat?limit=100`);
      if (response.success) {
        setMessages(response.messages);
        if (response.messages.length > 0) {
          lastMessageTimeRef.current = new Date(response.messages[response.messages.length - 1].createdAt).getTime();
        }
        
        // Mark chat as read when opening
        await backendClient.post(`/api/communities/${communityId}/chat/mark-read`);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  // Poll for new messages
  const pollNewMessages = useCallback(async () => {
    if (!communityId || !lastMessageTimeRef.current) return;

    try {
      const response = await backendClient.get(
        `/api/communities/${communityId}/chat/since/${lastMessageTimeRef.current}`
      );
      if (response.success && response.messages.length > 0) {
        setMessages(prev => [...prev, ...response.messages]);
        lastMessageTimeRef.current = new Date(
          response.messages[response.messages.length - 1].createdAt
        ).getTime();
      }
    } catch (err) {
      console.error('Failed to poll messages:', err);
    }
  }, [communityId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up polling
  useEffect(() => {
    if (communityId) {
      pollIntervalRef.current = setInterval(pollNewMessages, 5000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [communityId, pollNewMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !communityId || isSending) return;

    setIsSending(true);
    try {
      const response = await backendClient.post(`/api/communities/${communityId}/chat`, {
        content: newMessage.trim()
      });

      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        lastMessageTimeRef.current = new Date(response.message.createdAt).getTime();
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
      return `${t('common:time.yesterday')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isOwnMessage = (message) => {
    return message.author?.id === user?.id || message.author?.id === user?._id;
  };

  const goBack = () => {
    if (user?.role === 'president') {
      navigate('/dashboard');
    } else {
      navigate('/home');
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
    <div className="h-screen flex flex-col bg-gray-025">
      {/* Header */}
      <header className="bg-gray-0 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={goBack} className="mr-4 text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-10">{t('title')}</h1>
                {community && (
                  <p className="text-xs text-gray-7">{community.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-ui-error hover:text-ui-error-hover text-sm font-medium"
            >
              {t('common:navigation.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-large-s py-medium-m">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-gray-7">{t('noMessages')}</p>
              <p className="mt-1 text-sm text-gray-7">{t('startConversation')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = isOwnMessage(message);

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                    {!isOwn && (
                      <div className="flex items-center mb-1 ml-1">
                        <span className="text-xs font-medium text-gray-10">
                          {message.author?.name} {message.author?.surname}
                        </span>
                        {message.flat && (
                          <span className="ml-1 text-xs text-gray-7">
                            ({t('common:labels.flat')} {message.flat.number})
                          </span>
                        )}
                        {message.author?.role === 'president' && (
                          <span className="ml-1 px-1.5 py-0.5 bg-brand-primary text-brand-secondary text-xs rounded-inner">
                            {t('president')}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-medium-m py-medium-s ${
                        isOwn
                          ? 'bg-brand-secondary text-gray-0 rounded-br-md'
                          : 'bg-gray-0 shadow-sm rounded-bl-md'
                      }`}
                    >
                      <p className={`text-sm ${isOwn ? 'text-gray-0' : 'text-gray-10'}`}>
                        {message.content}
                      </p>
                    </div>
                    <p className={`text-xs text-gray-7 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-gray-0 border-t border-gray-1 flex-shrink-0 px-large-s py-medium-s">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-medium-m py-medium-s border border-gray-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            placeholder={t('placeholder')}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="w-10 h-10 bg-brand-secondary text-gray-0 rounded-full flex items-center justify-center hover:bg-brand-secondary-hover disabled:opacity-50 transition-colors"
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChat;
