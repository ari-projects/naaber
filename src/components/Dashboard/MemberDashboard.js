import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';
import BottomNav from '../Common/BottomNav';
import LanguageSelector from '../Common/LanguageSelector';

const MemberDashboard = () => {
  const { t } = useTranslation(['dashboard', 'common', 'events']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [community, setCommunity] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [paymentSummary, setPaymentSummary] = useState({ pendingCount: 0, overdueCount: 0, totalPending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get community ID from user object
        // Note: /api/auth/me returns community as an object with _id, name, address
        const communityId = user?.community?._id || user?.community?.id || user?.communityId;

        if (communityId) {
          // Set community from user data if available
          if (user?.community?.name) {
            setCommunity(user.community);
          }

          // Fetch announcements, events, unread count and payment summary in parallel
          const [announcementsRes, eventsRes, unreadRes, paymentRes] = await Promise.all([
            backendClient.get(`/api/communities/${communityId}/announcements?limit=5`),
            backendClient.get(`/api/communities/${communityId}/events?upcoming=true`),
            backendClient.get('/api/messages/unread/count'),
            backendClient.get('/api/payments/summary')
          ]);

          if (announcementsRes.success) {
            setAnnouncements(announcementsRes.announcements);
          }
          if (eventsRes.success) {
            setUpcomingEvents(eventsRes.events?.slice(0, 3) || []);
          }
          if (unreadRes.success) {
            setUnreadMessageCount(unreadRes.count || 0);
          }
          if (paymentRes.success) {
            setPaymentSummary(paymentRes);
          }
        }
      } catch (err) {
        console.error('Failed to fetch member dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('common:time.today');
    if (diffDays === 1) return t('common:time.yesterday');
    if (diffDays < 7) return t('common:time.daysAgo', { count: diffDays });

    return date.toLocaleDateString();
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-green-100 text-green-800';
      case 'vote': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const menuItems = [
    {
      label: t('common:navigation.announcements'),
      path: '/announcements',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      ),
      color: 'bg-blue-500'
    },
    {
      label: t('common:navigation.chat'),
      path: '/chat',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      ),
      color: 'bg-green-500'
    },
    {
      label: t('common:navigation.messages'),
      path: '/messages',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      ),
      color: 'bg-indigo-500',
      badge: unreadMessageCount > 0 ? unreadMessageCount : null
    },
    {
      label: t('common:navigation.maintenance'),
      path: '/maintenance',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      ),
      color: 'bg-orange-500'
    },
    {
      label: t('common:navigation.documents'),
      path: '/documents',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      ),
      color: 'bg-gray-500'
    },
    {
      label: t('common:navigation.payments'),
      path: '/payments',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      ),
      color: 'bg-teal-500'
    },
    {
      label: t('common:navigation.events'),
      path: '/events',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
      color: 'bg-pink-500'
    },
  ];

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
    <div className="min-h-screen bg-gray-025 pb-16 sm:pb-0">
      {/* Header */}
      <header className="bg-gray-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center justify-between">
            <div>
              <img src="/naaber-logotype.png" alt="Naaber" className="h-8" />
            </div>
            <div className="flex items-center space-x-3">
              {/*<LanguageSelector />*/}
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-7 hover:text-gray-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 13C14.7614 13 17 10.7614 17 8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8C7 10.7614 9.23858 13 12 13ZM12 13C14.1217 13 16.1566 13.8429 17.6569 15.3431C19.1571 16.8434 20 18.8783 20 21M12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="#0D0C07" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
              </button>
              {/*<button
                onClick={logout}
                className="text-ui-error hover:text-ui-error-hover text-sm font-medium"
              >
                {t('common:navigation.logout')}
              </button>*/}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-10">
            {t('member.welcome', { name: user?.name })}
          </h2>
        </div>

        {/* User & Community Info Card */}
        <div className="bg-gray-0 rounded-outer shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center mr-4">
                <span className="text-brand-secondary font-bold text-xl">
                  {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-10">{user?.name} {user?.surname}</p>
                {user?.flat && (
                  <p className="text-sm text-gray-7">
                    {t('member.flat', { number: user.flat.number })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {community && (
            <div className="mt-4 pt-4 border-t border-gray-1">
              <p className="text-xs text-gray-7 mb-1">{t('member.community')}</p>
              <p className="font-medium text-gray-10">{community.name}</p>
              <p className="text-sm text-gray-7">{community.address}</p>
            </div>
          )}
        </div>

        {/* Payment Reminder */}
        {(paymentSummary.pendingCount > 0 || paymentSummary.overdueCount > 0) && (
          <div
            onClick={() => navigate('/payments')}
            className={`rounded-outer shadow-sm p-medium-m mb-6 cursor-pointer transition-colors ${
              paymentSummary.overdueCount > 0
                ? 'bg-ui-error/10 hover:bg-ui-error/15 border border-ui-error/20'
                : 'bg-ui-warning/10 hover:bg-ui-warning/15 border border-ui-warning/20'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                paymentSummary.overdueCount > 0 ? 'bg-ui-error/20' : 'bg-ui-warning/20'
              }`}>
                <svg
                  className={`w-5 h-5 ${paymentSummary.overdueCount > 0 ? 'text-ui-error' : 'text-ui-warning'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className={`font-medium ${paymentSummary.overdueCount > 0 ? 'text-ui-error' : 'text-ui-warning'}`}>
                  {paymentSummary.overdueCount > 0
                    ? t('dashboard:member.overduePayments', { count: paymentSummary.overdueCount })
                    : t('dashboard:member.pendingPayments', { count: paymentSummary.pendingCount })}
                </p>
                <p className={`text-sm ${paymentSummary.overdueCount > 0 ? 'text-ui-error/80' : 'text-ui-warning/80'}`}>
                  {t('dashboard:member.totalAmount', { amount: paymentSummary.totalPending.toFixed(2) })}
                </p>
              </div>
              <svg className={`w-5 h-5 ${paymentSummary.overdueCount > 0 ? 'text-ui-error' : 'text-ui-warning'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-medium-s mb-6">
          {menuItems.slice(0, 3).map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center p-medium-m bg-gray-0 rounded-outer shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-gray-0 mb-small-l`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-10 text-center">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-ui-error text-gray-0 text-xs rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Latest Announcements */}
        <div className="bg-gray-0 rounded-outer shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-10">
              {t('member.latestAnnouncements')}
            </h3>
            <button
              onClick={() => navigate('/announcements')}
              className="text-sm text-brand-secondary hover:text-brand-secondary-hover font-medium"
            >
              {t('member.viewAll')}
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-10 w-10 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <p className="mt-2 text-sm text-gray-7">{t('member.noAnnouncements')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => navigate(`/announcements/${announcement.id}`)}
                  className="p-medium-m bg-gray-05 rounded-inner cursor-pointer hover:bg-gray-075 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                      {t(`common:navigation.${announcement.type === 'vote' ? 'events' : 'announcements'}`)}
                    </span>
                    <span className="text-xs text-gray-7">{formatDate(announcement.createdAt)}</span>
                  </div>
                  <h4 className="font-medium text-gray-10 mb-1">{announcement.title}</h4>
                  <p className="text-sm text-gray-7 line-clamp-2">{announcement.content}</p>

                  {announcement.type === 'vote' && !announcement.hasVoted && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-brand-primary text-brand-secondary text-xs rounded-inner">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Vote now
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="bg-gray-0 rounded-outer shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-10">
                {t('events:upcoming')}
              </h3>
              <button
                onClick={() => navigate('/events')}
                className="text-sm text-brand-secondary hover:text-brand-secondary-hover font-medium"
              >
                {t('member.viewAll')}
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate('/events')}
                  className="flex items-center p-medium-s bg-gradient-to-r from-brand-primary/30 to-brand-primary/10 rounded-inner cursor-pointer hover:from-brand-primary/40 hover:to-brand-primary/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-brand-secondary rounded-inner flex flex-col items-center justify-center text-gray-0 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold leading-none">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-xs uppercase">
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-10 truncate">{event.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-7">
                      <span>
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {event.isAttending ? (
                    <span className="px-2 py-1 bg-ui-success/20 text-ui-success text-xs rounded-full">
                      {t('events:attending')}
                    </span>
                  ) : (
                    <svg className="w-5 h-5 text-gray-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More Menu Items */}
        <div className="grid grid-cols-3 gap-medium-s">
          {menuItems.slice(3).map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center p-medium-m bg-gray-0 rounded-outer shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-gray-05 rounded-inner flex items-center justify-center mb-small-l">
                <svg className="w-5 h-5 text-gray-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-10 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav unreadMessages={unreadMessageCount} />
    </div>
  );
};

export default MemberDashboard;
