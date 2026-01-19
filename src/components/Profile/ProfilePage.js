import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';

const ProfilePage = () => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    language: 'ru'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await backendClient.get('/api/auth/me');
      setProfileData(response.user);
      setFormData({
        name: response.user.name || '',
        surname: response.user.surname || '',
        phone: response.user.phone || '',
        language: response.user.language || 'ru'
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await backendClient.put('/api/auth/me', formData);
      setProfileData(prev => ({ ...prev, ...response.user }));
      if (updateUser) {
        updateUser(response.user);
      }
      // Update language if changed
      if (formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language);
      }
      setSuccess(t('saved'));
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('common:errors.passwordMismatch') || 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await backendClient.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess(t('password.changed'));
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const languages = [
    { code: 'ru', label: 'Русский' },
    { code: 'et', label: 'Eesti' },
    { code: 'en', label: 'English' }
  ];

  if (!profileData) {
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
      <header className="bg-gray-0 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-large-s py-medium-m">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 text-gray-7 hover:text-gray-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-10">{t('title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-large-s py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-medium-m bg-ui-success/10 border border-ui-success/20 rounded-outer text-ui-success">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-medium-m bg-ui-error/10 border border-ui-error/20 rounded-outer text-ui-error">
            {error}
          </div>
        )}

        {/* Profile Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center text-gray-0 text-3xl font-bold mb-3">
            {profileData.name?.charAt(0)}{profileData.surname?.charAt(0)}
          </div>
          <h2 className="text-xl font-semibold text-gray-10">
            {profileData.name} {profileData.surname}
          </h2>
          <p className="text-gray-7">{t(`roles.${profileData.role}`)}</p>
        </div>

        {/* Personal Information */}
        <div className="bg-gray-0 rounded-outer shadow-sm mb-4">
          <div className="p-medium-m border-b border-gray-075 flex items-center justify-between">
            <h3 className="font-medium text-gray-10">{t('personalInfo')}</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-brand-secondary text-sm hover:text-brand-secondary-hover"
              >
                {t('editProfile')}
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="p-medium-m space-y-4">
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('name')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('surname')}</label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('language')}</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex-1 bg-brand-secondary text-gray-0 py-small-l rounded-outer hover:bg-brand-secondary-hover disabled:opacity-50"
                >
                  {isLoading ? t('common:actions.saving') : t('common:actions.save')}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profileData.name || '',
                      surname: profileData.surname || '',
                      phone: profileData.phone || '',
                      language: profileData.language || 'ru'
                    });
                  }}
                  className="flex-1 bg-gray-05 text-gray-10 py-small-l rounded-outer hover:bg-gray-075"
                >
                  {t('common:actions.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-medium-m space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-7">{t('name')}</span>
                <span className="text-gray-10">{profileData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-7">{t('surname')}</span>
                <span className="text-gray-10">{profileData.surname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-7">{t('email')}</span>
                <span className="text-gray-10">{profileData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-7">{t('phone')}</span>
                <span className="text-gray-10">{profileData.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-7">{t('language')}</span>
                <span className="text-gray-10">
                  {languages.find(l => l.code === profileData.language)?.label || profileData.language}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Community & Flat Info */}
        <div className="bg-gray-0 rounded-outer shadow-sm mb-4">
          <div className="p-medium-m border-b border-gray-075">
            <h3 className="font-medium text-gray-10">{t('community')}</h3>
          </div>
          <div className="p-medium-m space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-7">{t('community')}</span>
              <span className="text-gray-10">{profileData.community?.name || '-'}</span>
            </div>
            {profileData.flat && (
              <div className="flex justify-between">
                <span className="text-gray-7">{t('flat')}</span>
                <span className="text-gray-10">{profileData.flat?.number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-7">{t('role')}</span>
              <span className="text-gray-10">{t(`roles.${profileData.role}`)}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-0 rounded-outer shadow-sm mb-4">
          <div className="p-medium-m border-b border-gray-075 flex items-center justify-between">
            <h3 className="font-medium text-gray-10">{t('changePassword')}</h3>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="text-brand-secondary text-sm hover:text-brand-secondary-hover"
              >
                {t('common:actions.change')}
              </button>
            )}
          </div>

          {isChangingPassword && (
            <div className="p-medium-m space-y-4">
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('password.current')}</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('password.new')}</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-7 mb-1">{t('password.confirm')}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-medium-m py-small-l border border-gray-1 rounded-outer focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="flex-1 bg-brand-secondary text-gray-0 py-small-l rounded-outer hover:bg-brand-secondary-hover disabled:opacity-50"
                >
                  {isLoading ? t('common:actions.saving') : t('common:actions.save')}
                </button>
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-05 text-gray-10 py-small-l rounded-outer hover:bg-gray-075"
                >
                  {t('common:actions.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-gray-0 rounded-outer shadow-sm p-medium-m text-ui-error hover:bg-ui-error/5 transition-colors"
        >
          {t('logout')}
        </button>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-10/50 flex items-center justify-center z-50 p-medium-m">
          <div className="bg-gray-0 rounded-outer max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-10 mb-2">{t('logout')}</h3>
            <p className="text-gray-7 mb-6">{t('logoutConfirm')}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="flex-1 bg-ui-error text-gray-0 py-small-l rounded-outer hover:bg-ui-error-hover"
              >
                {t('logout')}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-05 text-gray-10 py-small-l rounded-outer hover:bg-gray-075"
              >
                {t('common:actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
