import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-[#F8F8F7] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Icon */}
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#65635D" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
          </div>
          <div className="text-[80px] md:text-[100px] font-bold text-[#0D0C07] leading-none tracking-[-0.03em]">
            404
          </div>
        </div>

        {/* Message */}
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#0D0C07] mb-3 leading-tight">
          {t('messages.noResults', 'Page not found')}
        </h1>
        <p className="text-[#65635D] text-[16px] md:text-[18px] leading-[28px] mb-8 max-w-md mx-auto">
          {t('messages.noData', 'The page you are looking for does not exist.')}
        </p>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex justify-center items-center gap-2 h-[56px] px-[40px] py-[14px] mb-4 rounded-lg border border-transparent bg-blue-600 text-white text-[14px] font-medium leading-[28px] transition-colors hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path d="M9 22V12h6v10" />
          </svg>
          <span>{t('navigation.home', 'Home')}</span>
        </button>

        {/* Secondary action */}
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#0D0C07] text-[14px] font-medium hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" />
            </svg>
            {t('actions.back', 'Go back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
