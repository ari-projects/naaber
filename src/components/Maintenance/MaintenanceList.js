import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const MaintenanceList = () => {
  const { t } = useTranslation(['maintenance', 'common']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPresident = user?.role === 'president';
  const communityId = user?.community?._id || user?.community?.id || user?.communityId;

  const fetchRequests = useCallback(async () => {
    if (!communityId) return;
    setIsLoading(true);
    try {
      const response = await backendClient.get(`/api/communities/${communityId}/maintenance`);
      if (response.success) {
        setRequests(response.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.title.trim() || !newRequest.description.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await backendClient.post(`/api/communities/${communityId}/maintenance`, newRequest);
      if (response.success) {
        setRequests([response.request, ...requests]);
        setNewRequest({ title: '', description: '', priority: 'medium' });
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create maintenance request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const response = await backendClient.put(`/api/maintenance/${requestId}`, { status: newStatus });
      if (response.success) {
        setRequests(requests.map(r =>
          r.id === requestId || r._id === requestId ? { ...r, status: newStatus } : r
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-ui-error/20 text-ui-error';
      case 'in_progress': return 'bg-ui-warning/20 text-ui-warning';
      case 'resolved': return 'bg-ui-success/20 text-ui-success';
      default: return 'bg-gray-2 text-gray-7';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-ui-error';
      case 'medium': return 'bg-ui-warning';
      case 'low': return 'bg-ui-success';
      default: return 'bg-gray-5';
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

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
              <button onClick={() => navigate(isPresident ? '/dashboard' : '/home')} className="mr-4 text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-10">{t('title')}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowCreateModal(true)} className="p-2 text-brand-secondary hover:bg-brand-primary/30 rounded-inner">
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

      <main className="max-w-4xl mx-auto px-large-s sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['all', 'open', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-medium-m py-medium-s rounded-inner text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status ? 'bg-brand-secondary text-gray-0' : 'bg-gray-0 text-gray-7 hover:bg-gray-1'
              }`}
            >
              {t(`status.${status}`)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-0/20 rounded-full text-xs">
                  {requests.filter(r => r.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-4 text-gray-7">{t('noRequests')}</p>
            <button onClick={() => setShowCreateModal(true)} className="mt-4 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover">
              {t('createNew')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id || request._id} className="bg-gray-0 rounded-outer shadow-sm p-medium-m hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                      <h3 className="font-semibold text-gray-10">{request.title}</h3>
                    </div>
                    <p className="text-sm text-gray-7 mb-3 line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-7">
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>{t(`status.${request.status}`)}</span>
                      <span>{t('common:labels.flat')}: {request.flatNumber || request.flat?.number}</span>
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  {isPresident && request.status !== 'resolved' && (
                    <div className="ml-4">
                      <select
                        value={request.status}
                        onChange={(e) => handleUpdateStatus(request.id || request._id, e.target.value)}
                        className="text-sm border border-gray-1 rounded-inner px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                      >
                        <option value="open">{t('status.open')}</option>
                        <option value="in_progress">{t('status.in_progress')}</option>
                        <option value="resolved">{t('status.resolved')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-medium-m">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-md w-full">
            <div className="p-medium-m border-b border-gray-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-10">{t('createNew')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-medium-m space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">{t('fields.title')} *</label>
                <input type="text" value={newRequest.title} onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })} className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary" placeholder={t('placeholders.title')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">{t('fields.description')} *</label>
                <textarea value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} rows={4} className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none" placeholder={t('placeholders.description')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">{t('fields.priority')}</label>
                <select value={newRequest.priority} onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })} className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                  <option value="low">{t('priority.low')}</option>
                  <option value="medium">{t('priority.medium')}</option>
                  <option value="high">{t('priority.high')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-medium-m py-medium-s border border-gray-1 text-gray-7 rounded-inner hover:bg-gray-025">{t('common:actions.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover disabled:opacity-50">{isSubmitting ? t('common:status.saving') : t('common:actions.submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
