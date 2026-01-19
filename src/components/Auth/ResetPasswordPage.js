import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../Common/LanguageSelector';

const ResetPasswordPage = () => {
  const { t } = useTranslation('auth');
  const { resetPassword, isLoading, clearError } = useAuth();
  const { token } = useParams();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.password) {
      setFormError(t('validation.passwordRequired'));
      return;
    }
    if (formData.password.length < 6) {
      setFormError(t('validation.passwordMin'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError(t('validation.passwordMatch'));
      return;
    }

    const result = await resetPassword(token, formData.password);

    if (result.success) {
      setSuccess(true);
    } else {
      setFormError(result.message || t('errors.tokenExpired'));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-025 flex flex-col">
        {/* Header */}
        <header className="bg-gray-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
            <div className="flex items-center justify-between">
              <div>
                <img src="/naaber-logotype.png" alt="Naaber" className="h-8" />
              </div>
              <div className="flex items-center space-x-3">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center py-12 px-large-s sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-ui-success/20 mb-4">
                <svg className="h-6 w-6 text-ui-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-10 mb-2">
                {t('resetPassword.title')}
              </h2>
              <p className="text-gray-7 mb-6">
                {t('resetPassword.successMessage')}
              </p>
              <Link
                to="/login"
                className="inline-flex justify-center py-medium-s px-6 border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover transition-colors"
              >
                {t('register.loginLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-025 flex flex-col">
        {/* Header */}
        <header className="bg-gray-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
            <div className="flex items-center justify-between">
              <div>
                <img src="/naaber-logotype.png" alt="Naaber" className="h-8" />
              </div>
              <div className="flex items-center space-x-3">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center py-12 px-large-s sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-ui-error/20 mb-4">
                <svg className="h-6 w-6 text-ui-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-ui-error mb-6">{t('errors.tokenExpired')}</p>
              <Link
                to="/forgot-password"
                className="inline-flex justify-center py-medium-s px-6 border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover transition-colors"
              >
                {t('forgotPassword.title')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-025 flex flex-col">
      {/* Header */}
      <header className="bg-gray-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-large-s sm:px-6 lg:px-8 py-medium-m">
          <div className="flex items-center justify-between">
            <div>
              <img src="/naaber-logotype.png" alt="Naaber" className="h-8" />
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center py-12 px-large-s sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-2xl font-bold text-gray-10">
            {t('resetPassword.title')}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-10">
                {t('resetPassword.newPassword')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-10">
                {t('resetPassword.confirmPassword')}
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="rounded-outer bg-ui-error/10 p-medium-m">
                <p className="text-sm text-ui-error">{formError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-medium-s px-medium-m border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  t('resetPassword.resetButton')
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
