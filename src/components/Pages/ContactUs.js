import React from 'react';
import { useTranslation } from 'react-i18next';

function ContactUs() {
  const { t } = useTranslation('pages');

  return (
    <div className="min-h-safe-screen bg-[#fff]">
      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
        <h1 className="text-[var(--Color-Grays-Gray-10,#0D0C07)] text-[28px] font-bold leading-[36px] mb-6">
          {t('contact.title')}
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-[16px] leading-[28px] mb-8">
            {t('contact.intro')}
          </p>

          <div className="bg-[#F8F8F7] rounded-[16px] p-8 mb-8">
            <h2 className="text-[20px] font-bold mb-4">{t('contact.getInTouch.title')}</h2>
            <p className="text-[16px] leading-[28px] mb-4">
              {t('contact.getInTouch.description')}
            </p>
            <a 
              href="mailto:support@9meals.ai" 
              className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#006600] md:hover:text-[#008800] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              support@9meals.ai
            </a>
          </div>

          <h2 className="text-[20px] font-bold mt-8 mb-4">{t('contact.helpSections.title')}</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-[#FFCB00] pl-4">
              <h3 className="text-[18px] font-semibold mb-2">{t('contact.helpSections.account.title')}</h3>
              <p className="text-[16px] leading-[28px] text-[#56554D]">
                {t('contact.helpSections.account.description')}
              </p>
            </div>

            <div className="border-l-4 border-[#FFCB00] pl-4">
              <h3 className="text-[18px] font-semibold mb-2">{t('contact.helpSections.mealPlanning.title')}</h3>
              <p className="text-[16px] leading-[28px] text-[#56554D]">
                {t('contact.helpSections.mealPlanning.description')}
              </p>
            </div>

            <div className="border-l-4 border-[#FFCB00] pl-4">
              <h3 className="text-[18px] font-semibold mb-2">{t('contact.helpSections.feedback.title')}</h3>
              <p className="text-[16px] leading-[28px] text-[#56554D]">
                {t('contact.helpSections.feedback.description')}
              </p>
            </div>

            <div className="border-l-4 border-[#FFCB00] pl-4">
              <h3 className="text-[18px] font-semibold mb-2">{t('contact.helpSections.privacy.title')}</h3>
              <p className="text-[16px] leading-[28px] text-[#56554D]">
                {t('contact.helpSections.privacy.description')}
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-[#FFF9E6] rounded-[16px] border border-[#FFCB00]">
            <h3 className="text-[18px] font-semibold mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFCB00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              {t('contact.beforeContact.title')}
            </h3>
            <p className="text-[16px] leading-[28px] text-[#56554D]">
              {t('contact.beforeContact.description')}
            </p>
          </div>

          <p className="text-[16px] leading-[28px] mt-8 text-center text-[#878683]">
            {t('contact.thankYou')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
