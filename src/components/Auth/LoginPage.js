import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../Common/LanguageSelector';

const LoginPage = () => {
  const { t } = useTranslation('auth');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.email) {
      setFormError(t('validation.emailRequired'));
      return;
    }
    if (!formData.password) {
      setFormError(t('validation.passwordRequired'));
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Redirect based on role
      if (result.user.role === 'president') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    } else {
      // Map backend error codes/messages to translations
      const errorCode = result.code;
      const errorMessage = result.message?.toLowerCase() || '';

      if (errorCode === 'ACCOUNT_PENDING' || errorMessage.includes('pending')) {
        setFormError(t('errors.accountPending'));
      } else if (errorCode === 'ACCOUNT_REJECTED' || errorMessage.includes('rejected')) {
        setFormError(t('errors.accountRejected'));
      } else if (errorCode === 'ACCOUNT_DISABLED' || errorMessage.includes('disabled')) {
        setFormError(t('errors.accountDisabled'));
      } else if (errorCode === 'INVALID_CREDENTIALS' || errorMessage.includes('invalid credentials')) {
        setFormError(t('errors.invalidCredentials'));
      } else if (errorCode === 'SERVER_ERROR' || errorMessage.includes('server error')) {
        setFormError(t('errors.serverError'));
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setFormError(t('errors.networkError'));
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        setFormError(t('errors.timeout'));
      } else {
        setFormError(result.message || t('errors.unknownError'));
      }
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/auth/google`;
  };

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
            {t('login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-7">
            {t('login.subtitle')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-10">
                  {t('login.email')}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-10">
                  {t('login.password')}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-brand-secondary hover:text-brand-secondary-hover"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              {/* Error Message */}
              {(formError || error) && (
                <div className="rounded-outer bg-ui-error/10 p-medium-m">
                  <p className="text-sm text-ui-error">{formError || error}</p>
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
                    t('login.loginButton')
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-1" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-0 text-gray-7">
                    {t('login.orContinueWith')}
                  </span>
                </div>
              </div>

              {/* Google Login */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex justify-center py-medium-s px-medium-m border border-gray-1 rounded-outer shadow-sm bg-gray-0 text-sm font-medium text-gray-10 hover:bg-gray-05 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('login.googleLogin')}
                </button>
              </div>
            </div>

            {/* Register Link */}
            <p className="mt-6 text-center text-sm text-gray-7">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-brand-secondary hover:text-brand-secondary-hover">
                {t('login.registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
