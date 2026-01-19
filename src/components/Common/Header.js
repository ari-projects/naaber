import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import UserAreaDrawer from '../Member/UserAreaDrawer';
import LanguageDrawer from './Drawers/LanguageDrawer';
import backendClient from '../../services/backendClient';
import { getCurrentLanguage, supportedLanguages, changeLanguage } from '../../services/i18n';

const Header = ({ 
  userCountry, 
  onCountryChange, 
  onLogoClick, 
  onShowMyMeals, 
  isLandingPage = false,
  showCountrySelector = false,
  showBackButton = false,
  onBackClick,
  animate = false
}) => {
  const { t } = useTranslation('common');
  const [showUserArea, setShowUserArea] = useState(false);
  const [showLanguageDrawer, setShowLanguageDrawer] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [userName, setUserName] = useState('');
  const [isAnimated, setIsAnimated] = useState(!animate);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Get current language info
  const currentLanguageInfo = supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];

  // Handle language change
  const handleLanguageChange = async (languageCode) => {
    // Change the UI language
    changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    // Save to backend if user is logged in
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      try {
        await backendClient.put('/api/user/language', { language: languageCode });
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  // Smart sticky header: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY.current;
          
          // Only trigger visibility change after scrolling a minimum threshold
          if (Math.abs(scrollDelta) > 5) {
            if (scrollDelta > 0 && currentScrollY > 60) {
              // Scrolling down & past header height - hide header
              setIsHeaderVisible(false);
            } else if (scrollDelta < 0) {
              // Scrolling up - show header
              setIsHeaderVisible(true);
            }
          }
          
          // Always show header when at the top
          if (currentScrollY < 10) {
            setIsHeaderVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger slide-in animation after mount
  useEffect(() => {
    if (animate && !isAnimated) {
      // Small delay to ensure the initial state is rendered
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [animate, isAnimated]);

  useEffect(() => {
    const currentToken = localStorage.getItem('authToken');
    setToken(currentToken);
    
    if (currentToken) {
      backendClient.get('/api/user/me')
        .then(data => {
          if (data && data.name) setUserName(data.name);
          // Apply user's saved language preference
          if (data && data.language && data.language !== currentLanguage) {
            changeLanguage(data.language);
            setCurrentLanguage(data.language);
          }
        })
        .catch(() => {});
    }
  }, [showUserArea, currentLanguage]);

  // Always sticky with smart show/hide behavior
  const headerClasses = "bg-gray-025 py-0 sticky top-0 z-50 backdrop-blur-[32px] border-b border-gray-0 shadow-[0px_1px_2px_0px_rgba(35,33,22,0.06),0px_6px_20px_0px_rgba(83,81,69,0.1)]";

  // Combined animation styles: initial slide-in (if animate prop) + scroll-based visibility
  const getTransform = () => {
    if (animate && !isAnimated) {
      return 'translateY(-100%)';
    }
    return isHeaderVisible ? 'translateY(0)' : 'translateY(-140%)';
  };

  const animationStyle = {
    transform: getTransform(),
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  return (
    <header className={headerClasses} style={animationStyle}>
      <div className="flex items-center">
        <div className="flex items-center px-large-s h-[48px] max-w-5xl w-full mx-auto justify-between">
          <div className="flex items-center">
            <div 
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${showBackButton ? 'w-11 opacity-100' : 'w-0 opacity-0'}
              `}
            >
              <button
                onClick={onBackClick}
                className="
                  p-small-m
                  rounded-outer
                  md:hover:bg-gray-1
                  bg-gray-0
                  border-base border-gray-10/20
                  w-8 h-8
                  flex items-center justify-center
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24" height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.6188 5.54803C12.9605 5.88974 12.9605 6.44376 12.6188 6.78547L8.27919 11.1251H17.8334C18.3167 11.1251 18.7084 11.5168 18.7084 12.0001C18.7084 12.4833 18.3167 12.8751 17.8334 12.8751H8.27918L12.6188 17.2147C12.9605 17.5564 12.9605 18.1104 12.6188 18.4521C12.2771 18.7938 11.7231 18.7938 11.3814 18.4521L5.54803 12.6188C5.20632 12.2771 5.20632 11.7231 5.54803 11.3814L11.3814 5.54803C11.7231 5.20632 12.2771 5.20632 12.6188 5.54803Z"
                    fill="#000000"
                  />
                </svg>
              </button>
            </div>
            <h1 className="cursor-pointer transition-all duration-300 ease-in-out" onClick={onLogoClick}>
              <img className='max-w-[92px]' alt="UrbanEats Logotype" src='ue-logotype-black.svg' />
            </h1>
          </div>
          <div className="flex items-center gap-small-l">
            {/* Language Selector */}
            <button
              className="py-small-l px-small-l flex font-medium text-gray-10 items-center text-[12.4px] md:hover:bg-gray-1 transition rounded-inner"
              onClick={() => setShowLanguageDrawer(true)}
              title={currentLanguageInfo.name}
            >
              <span className="text-medium-m">{currentLanguageInfo.flag}</span>
            </button>

            {/* User Profile */}
            <button
              className="py-small-l px-medium-s flex font-medium text-gray-10 items-center text-[12.4px] md:hover:bg-gray-1 transition rounded-inner"
              onClick={() => setShowUserArea(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 5.375C10.1821 5.375 8.70837 6.84873 8.70837 8.66667C8.70837 10.4846 10.1821 11.9583 12 11.9583C13.818 11.9583 15.2917 10.4846 15.2917 8.66667C15.2917 6.84873 13.818 5.375 12 5.375ZM15.1146 12.6315C16.2881 11.7084 17.0417 10.2755 17.0417 8.66667C17.0417 5.88223 14.7845 3.625 12 3.625C9.2156 3.625 6.95837 5.88223 6.95837 8.66667C6.95837 10.2755 7.71198 11.7084 8.88547 12.6315C8.06748 13.0024 7.3146 13.5199 6.66728 14.1672C5.25294 15.5816 4.45837 17.4998 4.45837 19.5C4.45837 19.9832 4.85012 20.375 5.33337 20.375C5.81662 20.375 6.20837 19.9832 6.20837 19.5C6.20837 17.964 6.81857 16.4908 7.90471 15.4047C8.99086 14.3185 10.464 13.7083 12 13.7083C13.5361 13.7083 15.0092 14.3185 16.0954 15.4047C17.1815 16.4908 17.7917 17.964 17.7917 19.5C17.7917 19.9832 18.1835 20.375 18.6667 20.375C19.15 20.375 19.5417 19.9832 19.5417 19.5C19.5417 17.4998 18.7471 15.5816 17.3328 14.1672C16.6855 13.5199 15.9326 13.0024 15.1146 12.6315Z" fill="#0D0C07"/>
              </svg>
              <span className="text-gray-10 text-center text-[12.8px] font-semibold leading-[15px] ml-1">
                {token ? (userName ? userName : t('profile.hello')) : t('header.signIn')}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* User Area Drawer */}
      <UserAreaDrawer 
        isOpen={showUserArea} 
        onClose={() => setShowUserArea(false)} 
        onShowMyMeals={onShowMyMeals} 
      />
      
      {/* Language Drawer */}
      <LanguageDrawer
        isOpen={showLanguageDrawer}
        onClose={() => setShowLanguageDrawer(false)}
        onLanguageChange={handleLanguageChange}
      />
    </header>
  );
};

export default Header;
