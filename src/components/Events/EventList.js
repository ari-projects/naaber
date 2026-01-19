import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const EventList = () => {
  const { t } = useTranslation(['events', 'common']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPresident = user?.role === 'president';
  const communityId = user?.community?._id || user?.community?.id || user?.communityId;

  useEffect(() => {
    fetchEvents();
  }, [communityId, showUpcoming]);

  const fetchEvents = async () => {
    if (!communityId) return;

    setIsLoading(true);
    try {
      const response = await backendClient.get(
        `/api/communities/${communityId}/events${showUpcoming ? '?upcoming=true' : ''}`
      );
      if (response.success) {
        setEvents(response.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;

    setIsSubmitting(true);
    try {
      // Combine date and time
      let eventDate = newEvent.date;
      if (newEvent.time) {
        eventDate = `${newEvent.date}T${newEvent.time}`;
      }

      const response = await backendClient.post(`/api/communities/${communityId}/events`, {
        title: newEvent.title,
        description: newEvent.description,
        date: eventDate,
        location: newEvent.location
      });
      if (response.success) {
        setEvents([response.event, ...events].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setNewEvent({ title: '', description: '', date: '', time: '', location: '' });
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAttendance = async (eventId) => {
    try {
      const response = await backendClient.post(`/api/events/${eventId}/attend`);
      if (response.success) {
        setEvents(events.map(e =>
          (e.id || e._id) === eventId
            ? { ...e, isAttending: response.isAttending, attendeesCount: response.attendeesCount }
            : e
        ));
      }
    } catch (err) {
      console.error('Failed to toggle attendance:', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm(t('common:messages.confirmDelete'))) return;

    try {
      const response = await backendClient.delete(`/api/events/${eventId}`);
      if (response.success) {
        setEvents(events.filter(e => (e.id || e._id) !== eventId));
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isEventPast = (dateString) => {
    return new Date(dateString) < new Date();
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
      {/* Header */}
      <header className="bg-gray-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(isPresident ? '/dashboard' : '/home')}
                className="mr-4 text-gray-7 hover:text-gray-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-10">{t('title')}</h1>
            </div>
            <div className="flex items-center space-x-3">
              {isPresident && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 text-brand-secondary hover:bg-brand-primary/30 rounded-inner"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={logout}
                className="text-ui-error hover:text-ui-error-hover text-sm font-medium"
              >
                {t('common:navigation.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-large-s sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setShowUpcoming(true)}
            className={`px-medium-m py-medium-s rounded-inner text-sm font-medium transition-colors ${
              showUpcoming
                ? 'bg-brand-secondary text-gray-0'
                : 'bg-gray-0 text-gray-7 hover:bg-gray-1'
            }`}
          >
            {t('upcoming')}
          </button>
          <button
            onClick={() => setShowUpcoming(false)}
            className={`px-medium-m py-medium-s rounded-inner text-sm font-medium transition-colors ${
              !showUpcoming
                ? 'bg-brand-secondary text-gray-0'
                : 'bg-gray-0 text-gray-7 hover:bg-gray-1'
            }`}
          >
            {t('all')}
          </button>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-7">{t('noEvents')}</p>
            {isPresident && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover"
              >
                {t('createNew')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const isPast = isEventPast(event.date);
              return (
                <div
                  key={event.id || event._id}
                  className={`bg-gray-0 rounded-outer shadow-sm overflow-hidden ${isPast ? 'opacity-60' : ''}`}
                >
                  <div className="flex">
                    {/* Date Badge */}
                    <div className="w-20 bg-brand-secondary text-gray-0 flex flex-col items-center justify-center py-medium-m">
                      <span className="text-2xl font-bold">
                        {new Date(event.date).getDate()}
                      </span>
                      <span className="text-xs uppercase">
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-medium-m">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-10">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-gray-7 mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-7">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(event.date)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.attendeesCount} {t('attending')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isPast && (
                            <button
                              onClick={() => handleToggleAttendance(event.id || event._id)}
                              className={`px-3 py-1.5 text-sm rounded-inner ${
                                event.isAttending
                                  ? 'bg-ui-success/20 text-ui-success hover:bg-ui-success/30'
                                  : 'bg-gray-1 text-gray-7 hover:bg-gray-2'
                              }`}
                            >
                              {event.isAttending ? t('attending') : t('attend')}
                            </button>
                          )}
                          {isPresident && (
                            <button
                              onClick={() => handleDeleteEvent(event.id || event._id)}
                              className="p-1.5 text-ui-error hover:bg-ui-error/10 rounded-inner"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-medium-m">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-md w-full">
            <div className="p-medium-m border-b border-gray-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-10">{t('createNew')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-7 hover:text-gray-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-medium-m space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.title')} *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  placeholder={t('placeholders.title')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.description')}
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={2}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
                  placeholder={t('placeholders.description')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-10 mb-1">
                    {t('fields.date')} *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-10 mb-1">
                    {t('fields.time')}
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.location')}
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  placeholder={t('placeholders.location')}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-medium-m py-medium-s border border-gray-1 text-gray-7 rounded-inner hover:bg-gray-025"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover disabled:opacity-50"
                >
                  {isSubmitting ? t('common:status.saving') : t('common:actions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
