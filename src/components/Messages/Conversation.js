import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import backendClient from '../../services/backendClient';

const Conversation = () => {
  const { t } = useTranslation(['messages', 'common']);
  const navigate = useNavigate();
  const { flatId } = useParams();

  const [messages, setMessages] = useState([]);
  const [otherFlat, setOtherFlat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    if (!flatId) return;
    try {
      const response = await backendClient.get(`/api/messages/${flatId}`);
      if (response.success) {
        setMessages(response.messages || []);
        setOtherFlat(response.flat);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [flatId]);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      await fetchMessages();
      setIsLoading(false);
    };
    if (flatId) loadMessages();
  }, [flatId, fetchMessages]);

  useEffect(() => {
    if (flatId) {
      pollIntervalRef.current = setInterval(fetchMessages, 3000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [flatId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const response = await backendClient.post('/api/messages', {
        toFlatId: flatId,
        content: newMessage.trim()
      });
      if (response.success) {
        setNewMessage('');
        await fetchMessages();
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('common:time.today');
    if (diffDays === 1) return t('common:time.yesterday');
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
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

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-screen bg-gray-025 flex flex-col">
      <header className="bg-gray-0 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center">
            <button onClick={() => navigate('/messages')} className="mr-4 text-gray-7 hover:text-gray-10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-brand-secondary font-semibold text-sm">{otherFlat?.number}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-10">{t('common:labels.flat')} {otherFlat?.number}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-large-s py-medium-m">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-gray-7">{t('noMessagesYet')}</p>
              <p className="mt-1 text-sm text-gray-7">{t('startConversation')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center justify-center mb-4">
                    <span className="px-3 py-1 bg-gray-2 rounded-full text-xs text-gray-7">{formatDate(group.date)}</span>
                  </div>
                  <div className="space-y-2">
                    {group.messages.map((msg) => (
                      <div key={msg.id || msg._id} className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-medium-m py-medium-s ${
                          msg.isFromMe
                            ? 'bg-brand-secondary text-gray-0 rounded-br-md'
                            : 'bg-gray-0 text-gray-10 shadow-sm rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.isFromMe ? 'text-gray-0/70' : 'text-gray-7'}`}>
                            {formatTime(msg.createdAt)}
                            {msg.isFromMe && msg.read && <span className="ml-1">✓✓</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <div className="bg-gray-0 border-t border-gray-1 px-large-s py-medium-s flex-shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={t('placeholder')}
                rows={1}
                className="w-full px-medium-m py-medium-s bg-gray-1 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                style={{ maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-medium-s bg-brand-secondary text-gray-0 rounded-full hover:bg-brand-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
