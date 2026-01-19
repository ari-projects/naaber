import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../Common/LanguageSelector';

const RegisterPage = () => {
  const { t } = useTranslation('auth');
  const { registerPresident, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    communityName: '',
    communityAddress: '',
  });
  const [formError, setFormError] = useState('');
  const [step, setStep] = useState(1); // 1 = personal info, 2 = community info

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    clearError();
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setFormError(t('validation.nameRequired'));
      return false;
    }
    if (!formData.surname.trim()) {
      setFormError(t('validation.surnameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      setFormError(t('validation.emailRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError(t('validation.emailInvalid'));
      return false;
    }
    if (!formData.phone.trim()) {
      setFormError(t('validation.phoneRequired'));
      return false;
    }
    if (!formData.password) {
      setFormError(t('validation.passwordRequired'));
      return false;
    }
    if (formData.password.length < 6) {
      setFormError(t('validation.passwordMin'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError(t('validation.passwordMatch'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.communityName.trim()) {
      setFormError(t('validation.communityNameRequired'));
      return false;
    }
    if (!formData.communityAddress.trim()) {
      setFormError(t('validation.addressRequired'));
      return false;
    }
    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateStep2()) {
      return;
    }

    const result = await registerPresident({
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      communityName: formData.communityName,
      communityAddress: formData.communityAddress,
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setFormError(result.message || t('errors.serverError'));
    }
  };

  const handleGoogleRegister = () => {
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
            {t('register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-7">
            {t('register.subtitle')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-brand-secondary text-gray-0' : 'bg-gray-2 text-gray-5'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 mx-2 ${step >= 2 ? 'bg-brand-secondary' : 'bg-gray-2'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-brand-secondary text-gray-0' : 'bg-gray-2 text-gray-5'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-6 px-4">
            <span className={`text-xs ${step === 1 ? 'text-brand-secondary font-medium' : 'text-gray-7'}`}>
              {t('register.personalInfo')}
            </span>
            <span className={`text-xs ${step === 2 ? 'text-brand-secondary font-medium' : 'text-gray-7'}`}>
              {t('register.communityInfo')}
            </span>
          </div>

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleNextStep}>
              {/* Name and Surname Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-10">
                    {t('register.name')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="given-name"
                      value={formData.name}
                      onChange={handleChange}
                      className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="surname" className="block text-sm font-medium text-gray-10">
                    {t('register.surname')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="surname"
                      name="surname"
                      type="text"
                      autoComplete="family-name"
                      value={formData.surname}
                      onChange={handleChange}
                      className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-10">
                  {t('register.email')}
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

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-10">
                  {t('register.phone')}
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    placeholder="+372 5123 4567"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-10">
                  {t('register.password')}
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
                  {t('register.confirmPassword')}
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
              {(formError || error) && (
                <div className="rounded-outer bg-ui-error/10 p-medium-m">
                  <p className="text-sm text-ui-error">{formError || error}</p>
                </div>
              )}

              {/* Next Button */}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-medium-s px-medium-m border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors"
                >
                  {t('common:next', 'Next')}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Community Name */}
              <div>
                <label htmlFor="communityName" className="block text-sm font-medium text-gray-10">
                  {t('register.communityName')}
                </label>
                <div className="mt-1">
                  <input
                    id="communityName"
                    name="communityName"
                    type="text"
                    value={formData.communityName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                    placeholder="Sunrise Apartments"
                  />
                </div>
              </div>

              {/* Community Address */}
              <div>
                <label htmlFor="communityAddress" className="block text-sm font-medium text-gray-10">
                  {t('register.communityAddress')}
                </label>
                <div className="mt-1">
                  <textarea
                    id="communityAddress"
                    name="communityAddress"
                    rows={3}
                    value={formData.communityAddress}
                    onChange={handleChange}
                    className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent resize-none"
                    placeholder="123 Main Street, Tallinn 10001"
                  />
                </div>
              </div>

              {/* Error Message */}
              {(formError || error) && (
                <div className="rounded-outer bg-ui-error/10 p-medium-m">
                  <p className="text-sm text-ui-error">{formError || error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 flex justify-center py-medium-s px-medium-m border border-gray-1 rounded-outer shadow-sm text-sm font-medium text-gray-10 bg-gray-0 hover:bg-gray-05 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors"
                >
                  {t('common:back', 'Back')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center py-medium-s px-medium-m border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    t('register.registerButton')
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider - only on step 1 */}
          {step === 1 && (
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

              {/* Google Register */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleRegister}
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
          )}

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-7">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-brand-secondary hover:text-brand-secondary-hover">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
