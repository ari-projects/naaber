import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../Common/LanguageSelector';

const ForgotPasswordPage = () => {
  const { t } = useTranslation('auth');
  const { forgotPassword, isLoading, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError(t('validation.emailRequired'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError(t('validation.emailInvalid'));
      return;
    }

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setFormError(result.message || t('errors.serverError'));
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-10 mb-2">
                {t('forgotPassword.title')}
              </h2>
              <p className="text-gray-7 mb-6">
                {t('forgotPassword.successMessage')}
              </p>
              <Link
                to="/login"
                className="inline-flex justify-center py-medium-s px-6 border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover transition-colors"
              >
                {t('forgotPassword.backToLogin')}
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
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-7">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-10">
                {t('forgotPassword.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                  placeholder="email@example.com"
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
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  t('forgotPassword.sendButton')
                )}
              </button>
            </div>
          </form>

          {/* Back to Login Link */}
          <p className="mt-6 text-center text-sm text-gray-7">
            <Link to="/login" className="font-medium text-brand-secondary hover:text-brand-secondary-hover">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
