import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunity } from '../../contexts/CommunityContext';

const AnnouncementManagement = () => {
  const { t } = useTranslation(['community', 'common']);
  const { logout } = useAuth();
  const {
    selectedCommunity,
    announcements,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncement,
    addComment,
    isLoading
  } = useCommunity();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'news',
    voteOptions: ['', ''],
    voteDeadline: '',
    sendEmail: false
  });

  useEffect(() => {
    if (selectedCommunity?.id) {
      fetchAnnouncements(selectedCommunity.id);
    }
  }, [selectedCommunity, fetchAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError(t('common:messages.requiredField'));
      return;
    }

    if (formData.type === 'vote') {
      const validOptions = formData.voteOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError(t('announcements.minVoteOptions'));
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    const data = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      sendEmail: formData.sendEmail
    };

    if (formData.type === 'vote') {
      data.voteOptions = formData.voteOptions.filter(opt => opt.trim());
      if (formData.voteDeadline) {
        data.voteDeadline = new Date(formData.voteDeadline).toISOString();
      }
    }

    const result = await createAnnouncement(data);

    if (result.success) {
      setShowCreateModal(false);
      setFormData({
        title: '',
        content: '',
        type: 'news',
        voteOptions: ['', ''],
        voteDeadline: '',
        sendEmail: false
      });
    } else {
      setError(result.message || t('common:messages.serverError'));
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (announcementId, title) => {
    if (window.confirm(t('announcements.deleteConfirm', { title }))) {
      await deleteAnnouncement(announcementId);
    }
  };

  const handleViewDetail = async (announcement) => {
    const result = await getAnnouncement(announcement.id);
    if (result.success) {
      setSelectedAnnouncement(result.announcement);
      setShowDetailModal(true);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const result = await addComment(selectedAnnouncement.id, newComment.trim());

    if (result.success) {
      setSelectedAnnouncement(prev => ({
        ...prev,
        comments: [...prev.comments, result.comment]
      }));
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const addVoteOption = () => {
    setFormData(prev => ({
      ...prev,
      voteOptions: [...prev.voteOptions, '']
    }));
  };

  const removeVoteOption = (index) => {
    if (formData.voteOptions.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      voteOptions: prev.voteOptions.filter((_, i) => i !== index)
    }));
  };

  const updateVoteOption = (index, value) => {
    setFormData(prev => ({
      ...prev,
      voteOptions: prev.voteOptions.map((opt, i) => i === index ? value : opt)
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'news': return 'bg-brand-primary/30 text-brand-secondary';
      case 'update': return 'bg-ui-success/20 text-ui-success';
      case 'vote': return 'bg-brand-secondary/20 text-brand-secondary';
      default: return 'bg-gray-2 text-gray-7';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'news':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'update':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'vote':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-025">
      {/* Header */}
      <header className="bg-gray-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 text-gray-7 hover:text-gray-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-10">{t('announcements.title')}</h1>
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

      <main className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-6">
        {/* Community Info */}
        {selectedCommunity && (
          <div className="mb-6 p-medium-m bg-brand-primary/20 rounded-outer">
            <p className="text-sm text-brand-secondary font-medium">{selectedCommunity.name}</p>
            <p className="text-xs text-gray-7">{selectedCommunity.address}</p>
          </div>
        )}

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-outer hover:bg-brand-secondary-hover transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('announcements.create')}
          </button>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-brand-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="mt-4 text-gray-7">{t('announcements.noAnnouncements')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-gray-0 rounded-outer shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                        {getTypeIcon(announcement.type)}
                        <span className="ml-1">{t(`announcements.types.${announcement.type}`)}</span>
                      </span>
                      <span className="ml-3 text-xs text-gray-7">
                        {formatDate(announcement.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-10 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-7 text-sm line-clamp-2 mb-3">
                      {announcement.content}
                    </p>

                    {/* Vote Results Preview */}
                    {announcement.type === 'vote' && announcement.voteOptions && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {announcement.voteOptions.slice(0, 3).map((option, idx) => (
                            <span key={idx} className="text-xs bg-brand-secondary/10 text-brand-secondary px-2 py-1 rounded-inner">
                              {option.text}: {option.voteCount || 0}
                            </span>
                          ))}
                          {announcement.voteOptions.length > 3 && (
                            <span className="text-xs text-gray-7">+{announcement.voteOptions.length - 3} more</span>
                          )}
                        </div>
                        {announcement.voteDeadline && (
                          <p className="text-xs text-gray-7 mt-1">
                            {t('announcements.deadline')}: {formatDate(announcement.voteDeadline)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-7">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {announcement.commentCount} {t('announcements.comments')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetail(announcement)}
                      className="p-2 text-brand-secondary hover:bg-brand-primary/20 rounded-outer transition-colors"
                      title={t('common:actions.view')}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id, announcement.title)}
                      className="p-2 text-ui-error hover:bg-ui-error/10 rounded-outer transition-colors"
                      title={t('common:actions.delete')}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-10">{t('announcements.create')}</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="text-gray-7 hover:text-gray-10"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreate}>
                {/* Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-10 mb-2">
                    {t('announcements.type')}
                  </label>
                  <div className="flex space-x-2">
                    {['news', 'update', 'vote'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                        className={`flex-1 py-medium-s px-medium-s rounded-outer text-sm font-medium transition-colors ${
                          formData.type === type
                            ? 'bg-brand-secondary text-gray-0'
                            : 'bg-gray-05 text-gray-7 hover:bg-gray-1'
                        }`}
                      >
                        {t(`announcements.types.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-10 mb-1">
                    {t('announcements.titleLabel')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-medium-m py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    placeholder={t('announcements.titlePlaceholder')}
                  />
                </div>

                {/* Content */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-10 mb-1">
                    {t('announcements.contentLabel')}
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-medium-m py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
                    placeholder={t('announcements.contentPlaceholder')}
                  />
                </div>

                {/* Vote Options (only for vote type) */}
                {formData.type === 'vote' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-10 mb-2">
                        {t('announcements.voteOptions')}
                      </label>
                      <div className="space-y-2">
                        {formData.voteOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateVoteOption(index, e.target.value)}
                              className="flex-1 px-medium-m py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                              placeholder={`${t('announcements.option')} ${index + 1}`}
                            />
                            {formData.voteOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeVoteOption(index)}
                                className="p-2 text-ui-error hover:bg-ui-error/10 rounded-outer"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={addVoteOption}
                        className="mt-2 text-sm text-brand-secondary hover:text-brand-secondary-hover font-medium"
                      >
                        + {t('announcements.addOption')}
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-10 mb-1">
                        {t('announcements.deadline')} ({t('common:labels.optional')})
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.voteDeadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, voteDeadline: e.target.value }))}
                        className="w-full px-medium-m py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                      />
                    </div>
                  </>
                )}

                {/* Send Email */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                      className="w-4 h-4 text-brand-secondary border-gray-1 rounded focus:ring-brand-secondary"
                    />
                    <span className="ml-2 text-sm text-gray-10">
                      {t('announcements.sendEmail')}
                    </span>
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-ui-error mb-4">{error}</p>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError('');
                    }}
                    className="flex-1 px-medium-m py-medium-s border border-gray-1 rounded-outer text-gray-10 hover:bg-gray-05 transition-colors"
                  >
                    {t('common:actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-outer hover:bg-brand-secondary-hover disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? t('common:status.saving') : t('announcements.publish')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-0 rounded-outer shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedAnnouncement.type)}`}>
                  {getTypeIcon(selectedAnnouncement.type)}
                  <span className="ml-1">{t(`announcements.types.${selectedAnnouncement.type}`)}</span>
                </span>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAnnouncement(null);
                    setNewComment('');
                  }}
                  className="text-gray-7 hover:text-gray-10"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-10 mb-2">
                {selectedAnnouncement.title}
              </h2>
              <p className="text-xs text-gray-7 mb-4">
                {selectedAnnouncement.author.name} {selectedAnnouncement.author.surname} - {formatDate(selectedAnnouncement.createdAt)}
              </p>

              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-gray-10 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>

              {/* Vote Results */}
              {selectedAnnouncement.type === 'vote' && selectedAnnouncement.voteOptions && (
                <div className="mb-6 p-medium-m bg-brand-secondary/10 rounded-outer">
                  <h4 className="text-sm font-semibold text-brand-secondary mb-3">{t('announcements.voteResults')}</h4>
                  <div className="space-y-2">
                    {selectedAnnouncement.voteOptions.map((option, idx) => {
                      const totalVotes = selectedAnnouncement.voteOptions.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
                      const percentage = totalVotes > 0 ? Math.round((option.voteCount || 0) / totalVotes * 100) : 0;

                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-10">{option.text}</span>
                            <span className="text-brand-secondary">{option.voteCount || 0} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-2 rounded-full h-2">
                            <div
                              className="bg-brand-secondary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedAnnouncement.voteDeadline && (
                    <p className="text-xs text-gray-7 mt-3">
                      {t('announcements.deadline')}: {formatDate(selectedAnnouncement.voteDeadline)}
                    </p>
                  )}
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t border-gray-1 pt-4">
                <h4 className="text-sm font-semibold text-gray-10 mb-3">
                  {t('announcements.comments')} ({selectedAnnouncement.comments?.length || 0})
                </h4>

                {selectedAnnouncement.comments?.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {selectedAnnouncement.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-05 rounded-inner p-medium-s">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-10">
                            {comment.author.name} {comment.author.surname}
                            {comment.flat && (
                              <span className="ml-2 text-xs text-gray-7">
                                ({t('common:labels.flat')} {comment.flat.number})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-7">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-7">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-7 mb-4">{t('announcements.noComments')}</p>
                )}

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-medium-m py-medium-s border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    placeholder={t('announcements.addComment')}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-outer hover:bg-brand-secondary-hover disabled:opacity-50 transition-colors"
                  >
                    {t('common:actions.send')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;
