import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunity } from '../../contexts/CommunityContext';

const AnnouncementDetail = () => {
  const { t } = useTranslation(['community', 'common']);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getAnnouncement, addComment, voteOnAnnouncement } = useCommunity();

  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setIsLoading(true);
      const result = await getAnnouncement(id);
      if (result.success) {
        setAnnouncement(result.announcement);
      } else {
        setError(result.message || 'Failed to load announcement');
      }
      setIsLoading(false);
    };

    fetchAnnouncement();
  }, [id, getAnnouncement]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const result = await addComment(id, newComment.trim());

    if (result.success) {
      setAnnouncement(prev => ({
        ...prev,
        comments: [...(prev.comments || []), result.comment]
      }));
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleVote = async (optionId) => {
    if (announcement.hasVoted) return;

    setIsSubmitting(true);
    const result = await voteOnAnnouncement(id, optionId);

    if (result.success) {
      setAnnouncement(prev => ({
        ...prev,
        voteOptions: result.voteResults,
        hasVoted: true
      }));
    }
    setIsSubmitting(false);
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

  const isVoteExpired = () => {
    if (!announcement?.voteDeadline) return false;
    return new Date() > new Date(announcement.voteDeadline);
  };

  const goBack = () => {
    if (user?.role === 'president') {
      navigate('/announcements');
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

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-gray-025">
        <header className="bg-gray-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
            <div className="flex items-center">
              <button onClick={goBack} className="mr-4 text-gray-7 hover:text-gray-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-10">{t('announcements.title')}</h1>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-large-s py-8">
          <div className="text-center py-12">
            <p className="text-gray-7">{error || 'Announcement not found'}</p>
          </div>
        </main>
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
              <button onClick={goBack} className="mr-4 text-gray-7 hover:text-gray-10">
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

      <main className="max-w-3xl mx-auto px-large-s sm:px-6 lg:px-8 py-6">
        {/* Announcement Card */}
        <div className="bg-gray-0 rounded-outer shadow-sm p-medium-m mb-6">
          {/* Type Badge & Date */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
              {t(`announcements.types.${announcement.type}`)}
            </span>
            <span className="text-sm text-gray-7">{formatDate(announcement.createdAt)}</span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-10 mb-2">{announcement.title}</h2>

          {/* Author */}
          <p className="text-sm text-gray-7 mb-4">
            {announcement.author?.name} {announcement.author?.surname}
          </p>

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-10 whitespace-pre-wrap">{announcement.content}</p>
          </div>

          {/* Vote Section */}
          {announcement.type === 'vote' && announcement.voteOptions && (
            <div className="p-medium-m bg-brand-primary/20 rounded-inner">
              <h4 className="text-sm font-semibold text-brand-secondary mb-3">
                {announcement.hasVoted || isVoteExpired() ? t('announcements.voteResults') : 'Cast your vote'}
              </h4>

              {announcement.voteDeadline && (
                <p className={`text-xs mb-3 ${isVoteExpired() ? 'text-ui-error' : 'text-brand-secondary'}`}>
                  {t('announcements.deadline')}: {formatDate(announcement.voteDeadline)}
                  {isVoteExpired() && ' (Ended)'}
                </p>
              )}

              <div className="space-y-2">
                {announcement.voteOptions.map((option) => {
                  const totalVotes = announcement.voteOptions.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
                  const percentage = totalVotes > 0 ? Math.round((option.voteCount || 0) / totalVotes * 100) : 0;
                  const canVote = !announcement.hasVoted && !isVoteExpired();

                  return (
                    <div key={option.optionId || option._id || option.id}>
                      {canVote ? (
                        <button
                          onClick={() => handleVote(option.optionId || option._id || option.id)}
                          disabled={isSubmitting}
                          className="w-full text-left p-medium-s border border-brand-secondary/30 rounded-inner hover:bg-brand-primary/30 transition-colors disabled:opacity-50"
                        >
                          <span className="text-gray-10">{option.text}</span>
                        </button>
                      ) : (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-10">{option.text}</span>
                            <span className="text-brand-secondary">{option.voteCount || 0} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-brand-primary/30 rounded-full h-2">
                            <div
                              className="bg-brand-secondary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {announcement.hasVoted && (
                <p className="text-xs text-brand-secondary mt-3">You have already voted</p>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-gray-0 rounded-outer shadow-sm p-medium-m">
          <h3 className="text-lg font-semibold text-gray-10 mb-4">
            {t('announcements.comments')} ({announcement.comments?.length || 0})
          </h3>

          {/* Comments List */}
          {announcement.comments?.length > 0 ? (
            <div className="space-y-3 mb-6">
              {announcement.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-025 rounded-inner p-medium-m">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center mr-2">
                        <span className="text-brand-secondary font-medium text-xs">
                          {comment.author?.name?.charAt(0)}{comment.author?.surname?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-10">
                          {comment.author?.name} {comment.author?.surname}
                        </span>
                        {comment.flat && (
                          <span className="ml-2 text-xs text-gray-7">
                            ({t('common:labels.flat')} {comment.flat.number})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-7">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-10 pl-10">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-7 mb-6">{t('announcements.noComments')}</p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-medium-m py-medium-s border border-gray-1 rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              placeholder={t('announcements.addComment')}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-medium-m py-medium-s bg-brand-secondary text-gray-0 rounded-inner hover:bg-brand-secondary-hover disabled:opacity-50 transition-colors"
            >
              {t('common:actions.send')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementDetail;
