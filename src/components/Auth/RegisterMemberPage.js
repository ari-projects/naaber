import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import backendClient from '../../services/backendClient';
import LanguageSelector from '../Common/LanguageSelector';

const RegisterMemberPage = () => {
  const { t } = useTranslation('auth');
  const { registerMember, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { communityId: paramCommunityId } = useParams();
  const [searchParams] = useSearchParams();

  const [community, setCommunity] = useState(null);
  const [flats, setFlats] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    flatId: '',
  });
  const [formError, setFormError] = useState('');

  // Get community ID from URL params or query string
  const communityId = paramCommunityId || searchParams.get('community');

  // Fetch community and flats on mount
  useEffect(() => {
    if (communityId) {
      fetchCommunity(communityId);
    }
  }, [communityId]);

  const fetchCommunity = async (id) => {
    setLoadingCommunity(true);
    setCommunityError('');
    try {
      const response = await backendClient.get(`/api/communities/public/${id}`);
      if (response.success) {
        setCommunity(response.community);
        setFlats(response.flats || []);
      } else {
        setCommunityError(response.message || t('errors.serverError'));
      }
    } catch (err) {
      setCommunityError(err.message || t('errors.serverError'));
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    clearError();
  };

  const validateForm = () => {
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
    if (!formData.flatId) {
      setFormError(t('validation.flatRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    const result = await registerMember({
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      flatId: formData.flatId,
    });

    if (result.success) {
      setRegistrationSuccess(true);
    } else {
      // Use translation based on error code if available
      const errorCode = result.code;
      if (errorCode === 'ALREADY_IN_COMMUNITY') {
        setFormError(t('errors.alreadyInCommunity'));
      } else {
        setFormError(result.message || t('errors.serverError'));
      }
    }
  };

  // Show success message after registration
  if (registrationSuccess) {
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
                {t('registerMember.title')}
              </h2>
              <p className="text-gray-7 mb-6">
                {t('registerMember.pendingMessage')}
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

  // Show community not found or no community ID
  if (!communityId) {
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
              {t('registerMember.title')}
            </h2>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-ui-warning/20 mb-4">
                <svg className="h-6 w-6 text-ui-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-7 mb-6">
                {t('common:noCommunityLink', 'Please use the registration link provided by your community president.')}
              </p>
              <Link
                to="/login"
                className="inline-flex justify-center py-medium-s px-6 border border-gray-1 rounded-outer shadow-sm text-sm font-medium text-gray-10 bg-gray-0 hover:bg-gray-05 transition-colors"
              >
                {t('register.loginLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading community
  if (loadingCommunity) {
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

        <div className="flex-1 flex justify-center items-center py-12 px-large-s">
          <svg className="animate-spin h-10 w-10 text-brand-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // Community not found
  if (communityError) {
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
              <p className="text-ui-error mb-6">{communityError}</p>
              <Link
                to="/login"
                className="inline-flex justify-center py-medium-s px-6 border border-gray-1 rounded-outer shadow-sm text-sm font-medium text-gray-10 bg-gray-0 hover:bg-gray-05 transition-colors"
              >
                {t('register.loginLink')}
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
            {t('registerMember.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-7">
            {t('registerMember.subtitle')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-0 py-8 px-large-s shadow-sm rounded-outer sm:px-10">
            {/* Community Info Card */}
          {community && (
            <div className="mb-6 p-medium-m bg-brand-primary/20 rounded-outer">
              <p className="text-sm text-brand-secondary font-medium">{community.name}</p>
              <p className="text-xs text-gray-7 mt-1">{community.address}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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

            {/* Flat Selection */}
            <div>
              <label htmlFor="flatId" className="block text-sm font-medium text-gray-10">
                {t('registerMember.selectFlat')}
              </label>
              <div className="mt-1">
                <select
                  id="flatId"
                  name="flatId"
                  value={formData.flatId}
                  onChange={handleChange}
                  className="appearance-none block w-full px-medium-s py-medium-s border border-gray-1 rounded-outer shadow-sm placeholder-gray-4 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent bg-gray-0"
                >
                  <option value="">{t('registerMember.flatNumber')}</option>
                  {flats.map((flat) => (
                    <option key={flat.id} value={flat.id}>
                      {flat.number}
                    </option>
                  ))}
                </select>
              </div>
              {flats.length === 0 && (
                <p className="mt-1 text-xs text-gray-7">
                  {t('common:noFlatsAvailable', 'No flats available yet. Please contact your community president.')}
                </p>
              )}
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || flats.length === 0}
                className="w-full flex justify-center py-medium-s px-medium-m border border-transparent rounded-outer shadow-sm text-sm font-medium text-gray-0 bg-brand-secondary hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  t('registerMember.registerButton')
                )}
              </button>
            </div>
          </form>

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

export default RegisterMemberPage;
