import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const DocumentList = () => {
  const { t } = useTranslation(['documents', 'common']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'other',
    fileUrl: '',
    fileName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPresident = user?.role === 'president';
  const communityId = user?.community?._id || user?.community?.id || user?.communityId;

  useEffect(() => {
    fetchDocuments();
  }, [communityId]);

  const fetchDocuments = async () => {
    if (!communityId) return;

    setIsLoading(true);
    try {
      const response = await backendClient.get(`/api/communities/${communityId}/documents`);
      if (response.success) {
        setDocuments(response.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!newDocument.title.trim() || !newDocument.fileUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await backendClient.post(`/api/communities/${communityId}/documents`, {
        ...newDocument,
        fileName: newDocument.fileName || newDocument.title
      });
      if (response.success) {
        setDocuments([response.document, ...documents]);
        setNewDocument({ title: '', description: '', category: 'other', fileUrl: '', fileName: '' });
        setShowUploadModal(false);
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm(t('common:messages.confirmDelete'))) return;

    try {
      const response = await backendClient.delete(`/api/documents/${docId}`);
      if (response.success) {
        setDocuments(documents.filter(d => (d.id || d._id) !== docId));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'rules': return 'bg-brand-primary/30 text-brand-secondary';
      case 'minutes': return 'bg-ui-success/20 text-ui-success';
      case 'contracts': return 'bg-brand-secondary/20 text-brand-secondary';
      default: return 'bg-gray-2 text-gray-7';
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-ui-error" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (fileType?.includes('image')) {
      return (
        <svg className="w-8 h-8 text-ui-success" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredDocuments = documents.filter(d =>
    filter === 'all' || d.category === filter
  );

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
                  onClick={() => setShowUploadModal(true)}
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
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['all', 'rules', 'minutes', 'contracts', 'other'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-medium-m py-medium-s rounded-inner text-sm font-medium whitespace-nowrap transition-colors ${
                filter === category
                  ? 'bg-brand-secondary text-gray-0'
                  : 'bg-gray-0 text-gray-7 hover:bg-gray-1'
              }`}
            >
              {t(`category.${category}`)}
            </button>
          ))}
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-7">{t('noDocuments')}</p>
            {isPresident && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover"
              >
                {t('upload')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id || doc._id}
                className="bg-gray-0 rounded-outer shadow-sm p-medium-m hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-10 truncate">{doc.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(doc.category)}`}>
                        {t(`category.${doc.category}`)}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-7 mb-2 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-7">
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                      {doc.uploadedBy && (
                        <span>{doc.uploadedBy.name} {doc.uploadedBy.surname}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-brand-secondary hover:bg-brand-primary/30 rounded-inner"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    {isPresident && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id || doc._id)}
                        className="p-2 text-ui-error hover:bg-ui-error/10 rounded-inner"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-medium-m">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-md w-full">
            <div className="p-medium-m border-b border-gray-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-10">{t('upload')}</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-7 hover:text-gray-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUploadDocument} className="p-medium-m space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.title')} *
                </label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
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
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  rows={2}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
                  placeholder={t('placeholders.description')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.fileUrl')} *
                </label>
                <input
                  type="url"
                  value={newDocument.fileUrl}
                  onChange={(e) => setNewDocument({ ...newDocument, fileUrl: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  placeholder="https://..."
                  required
                />
                <p className="mt-1 text-xs text-gray-7">{t('fileUrlHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-10 mb-1">
                  {t('fields.category')}
                </label>
                <select
                  value={newDocument.category}
                  onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                  className="w-full px-medium-s py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                >
                  <option value="rules">{t('category.rules')}</option>
                  <option value="minutes">{t('category.minutes')}</option>
                  <option value="contracts">{t('category.contracts')}</option>
                  <option value="other">{t('category.other')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-medium-m py-medium-s border border-gray-1 text-gray-7 rounded-inner hover:bg-gray-025"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover disabled:opacity-50"
                >
                  {isSubmitting ? t('common:status.saving') : t('common:actions.upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
