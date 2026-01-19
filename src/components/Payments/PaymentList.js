import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const PaymentList = () => {
  const { t } = useTranslation(['payments', 'common']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [flats, setFlats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    flatId: '',
    amount: '',
    description: '',
    dueDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  const isPresident = user?.role === 'president';
  const communityId = user?.community?._id || user?.community?.id || user?.communityId;

  const fetchPayments = useCallback(async () => {
    if (!communityId) return;

    setIsLoading(true);
    try {
      const response = await backendClient.get(`/api/communities/${communityId}/payments`);
      if (response.success) {
        setPayments(response.payments || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  const fetchFlats = useCallback(async () => {
    if (!communityId) return;
    try {
      const response = await backendClient.get(`/api/communities/${communityId}/flats`);
      if (response.success) {
        setFlats(response.flats || []);
      }
    } catch (err) {
      console.error('Failed to fetch flats:', err);
    }
  }, [communityId]);

  useEffect(() => {
    fetchPayments();
    if (isPresident) {
      fetchFlats();
    }
  }, [fetchPayments, fetchFlats, isPresident]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!newPayment.flatId || !newPayment.amount || !newPayment.description || !newPayment.dueDate) return;

    setIsSubmitting(true);
    try {
      const response = await backendClient.post(`/api/communities/${communityId}/payments`, {
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      });
      if (response.success) {
        setPayments([response.payment, ...payments]);
        setNewPayment({ flatId: '', amount: '', description: '', dueDate: '' });
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (paymentId) => {
    // Members need to provide invoice URL, presidents can mark directly
    if (!isPresident) {
      setSelectedPaymentId(paymentId);
      setInvoiceUrl('');
      setShowInvoiceModal(true);
      return;
    }

    try {
      const response = await backendClient.put(`/api/payments/${paymentId}/mark-paid`);
      if (response.success) {
        setPayments(payments.map(p =>
          (p.id || p._id) === paymentId
            ? { ...p, status: 'paid', paidAt: response.payment.paidAt }
            : p
        ));
      }
    } catch (err) {
      console.error('Failed to mark payment as paid:', err);
    }
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceUrl.trim() || !selectedPaymentId) return;

    setIsSubmitting(true);
    try {
      const response = await backendClient.put(`/api/payments/${selectedPaymentId}/mark-paid`, {
        invoiceUrl: invoiceUrl.trim()
      });
      if (response.success) {
        setPayments(payments.map(p =>
          (p.id || p._id) === selectedPaymentId
            ? { ...p, status: 'paid', paidAt: response.payment.paidAt, invoiceUrl: response.payment.invoiceUrl }
            : p
        ));
        setShowInvoiceModal(false);
        setSelectedPaymentId(null);
        setInvoiceUrl('');
      }
    } catch (err) {
      console.error('Failed to mark payment as paid:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-ui-success/20 text-ui-success';
      case 'pending': return 'bg-ui-warning/20 text-ui-warning';
      case 'overdue': return 'bg-ui-error/20 text-ui-error';
      default: return 'bg-gray-2 text-gray-7';
    }
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredPayments = payments.filter(p =>
    filter === 'all' || p.status === filter
  );

  // Calculate totals
  const totalPending = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

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
                  className="p-2 text-brand-secondary hover:bg-brand-primary/20 rounded-outer"
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
        {/* Summary Card */}
        {totalPending > 0 && (
          <div className="bg-gradient-to-r from-brand-secondary to-brand-secondary-hover rounded-outer p-medium-m mb-6 text-gray-0">
            <p className="text-sm opacity-90">{t('totalDue')}</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'overdue', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-medium-m py-medium-s rounded-outer text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-brand-secondary text-gray-0'
                  : 'bg-gray-0 text-gray-7 hover:bg-gray-05'
              }`}
            >
              {t(`status.${status}`)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-0/20 rounded-full text-xs">
                  {payments.filter(p => p.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-4 text-gray-7">{t('noPayments')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id || payment._id}
                className="bg-gray-0 rounded-outer shadow-sm p-medium-m hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold text-gray-10">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                        {t(`status.${payment.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-10 mb-2">{payment.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-7">
                      {isPresident && <span>{t('common:labels.flat')}: {payment.flatNumber}</span>}
                      <span>{t('dueDate')}: {formatDate(payment.dueDate)}</span>
                      {payment.paidAt && <span>{t('paidAt')}: {formatDate(payment.paidAt)}</span>}
                    </div>
                    {payment.invoiceUrl && (
                      <a
                        href={payment.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-brand-secondary hover:text-brand-secondary-hover"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t('viewInvoice')}
                      </a>
                    )}
                  </div>
                  {payment.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(payment.id || payment._id)}
                      className="px-medium-s py-small-l bg-ui-success text-gray-0 text-sm rounded-outer hover:bg-ui-success/90"
                    >
                      {t('markPaid')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-4">
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
            <form onSubmit={handleCreatePayment} className="p-medium-m space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.flat')} *
                </label>
                <select
                  value={newPayment.flatId}
                  onChange={(e) => setNewPayment({ ...newPayment, flatId: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  required
                >
                  <option value="">{t('selectFlat')}</option>
                  {flats.map((flat) => (
                    <option key={flat.id || flat._id} value={flat.id || flat._id}>
                      {t('common:labels.flat')} {flat.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.amount')} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="w-full px-medium-s py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-7">EUR</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.description')} *
                </label>
                <input
                  type="text"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  placeholder={t('placeholders.description')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.dueDate')} *
                </label>
                <input
                  type="date"
                  value={newPayment.dueDate}
                  onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-medium-m py-medium-s border border-gray-1 text-gray-7 rounded-outer hover:bg-gray-05"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-outer hover:bg-brand-secondary-hover disabled:opacity-50"
                >
                  {isSubmitting ? t('common:status.saving') : t('common:actions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Upload Modal (for members) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-md w-full">
            <div className="p-medium-m border-b border-gray-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-10">{t('uploadInvoice')}</h3>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedPaymentId(null);
                  setInvoiceUrl('');
                }}
                className="text-gray-7 hover:text-gray-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitInvoice} className="p-medium-m space-y-4">
              <p className="text-sm text-gray-7">{t('invoiceRequired')}</p>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.invoiceUrl')} *
                </label>
                <input
                  type="url"
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  placeholder={t('placeholders.invoiceUrl')}
                  required
                />
                <p className="mt-1 text-xs text-gray-4">{t('invoiceUrlHint')}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setSelectedPaymentId(null);
                    setInvoiceUrl('');
                  }}
                  className="flex-1 px-medium-m py-medium-s border border-gray-1 text-gray-7 rounded-outer hover:bg-gray-05"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !invoiceUrl.trim()}
                  className="flex-1 px-medium-m py-medium-s bg-ui-success text-gray-0 rounded-outer hover:bg-ui-success/90 disabled:opacity-50"
                >
                  {isSubmitting ? t('common:status.saving') : t('confirmPayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentList;
