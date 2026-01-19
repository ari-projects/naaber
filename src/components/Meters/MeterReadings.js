import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MeterReadings = () => {
  const { t } = useTranslation(['meters', 'common']);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#eeede7]">
      {/* Header */}
      <header className="bg-white flex items-center justify-between px-6 py-2 min-h-[52px]">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#0D0C07" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-[#0d0c07]">{t('meters:title')}</h1>
        <div className="w-9" /> {/* Spacer for alignment */}
      </header>

      {/* Content */}
      <main className="px-6 py-8">
        <div className="bg-[#f8f8f7] rounded-xl border border-white p-8 text-center">
          <div className="w-16 h-16 bg-[#eeede7] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 14C3.81077 14.0006 3.62523 13.9476 3.46495 13.847C3.30468 13.7464 3.17623 13.6024 3.09455 13.4317C3.01287 13.261 2.98129 13.0706 3.0035 12.8827C3.02571 12.6947 3.10078 12.517 3.22 12.37L13.12 2.17C13.1943 2.08428 13.2955 2.02636 13.407 2.00573C13.5185 1.98511 13.6337 2.00301 13.7337 2.0565C13.8337 2.11 13.9126 2.1959 13.9573 2.30011C14.0021 2.40432 14.0101 2.52065 13.98 2.63L12.06 8.65C12.0034 8.80152 11.9844 8.96452 12.0046 9.12501C12.0248 9.28549 12.0837 9.43868 12.1761 9.57143C12.2685 9.70417 12.3918 9.81251 12.5353 9.88716C12.6788 9.96181 12.8382 10.0005 13 10H20C20.1892 9.99935 20.3748 10.0524 20.535 10.153C20.6953 10.2536 20.8238 10.3976 20.9055 10.5683C20.9871 10.739 21.0187 10.9294 20.9965 11.1173C20.9743 11.3053 20.8992 11.483 20.78 11.63L10.88 21.83C10.8057 21.9157 10.7045 21.9736 10.593 21.9943C10.4815 22.0149 10.3663 21.997 10.2663 21.9435C10.1663 21.89 10.0874 21.8041 10.0427 21.6999C9.99791 21.5957 9.98992 21.4794 10.02 21.37L11.94 15.35C11.9966 15.1985 12.0156 15.0355 11.9954 14.875C11.9752 14.7145 11.9163 14.5613 11.8239 14.4286C11.7315 14.2958 11.6082 14.1875 11.4647 14.1128C11.3212 14.0382 11.1618 13.9995 11 14H4Z" 
                stroke="#0d0c07" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#0d0c07] mb-2">{t('meters:comingSoon')}</h2>
          <p className="text-[#56554d] text-sm">{t('meters:comingSoonDescription')}</p>
        </div>
      </main>
    </div>
  );
};

export default MeterReadings;
