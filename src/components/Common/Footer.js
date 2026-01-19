import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CountrySelector from './CountrySelector';

const Footer = () => {
  const { t } = useTranslation('pages');
  
  return (
    <>
      <footer className="bg-[#F3F3F2] text-gray-100 pt-4 text-center">
        <div className="box-border content-stretch flex flex-col gap-6 items-center justify-center pb-0 pt-7 px-0 relative w-full h-auto">
            
            <div className="relative shrink-0 w-full">
                <div className="flex flex-col items-center relative w-full h-auto">
                    <div className="box-border content-stretch flex flex-col gap-4 items-center justify-start px-6 py-0 relative w-full">
                        
                        <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0">
                            <div className="content-stretch flex gap-1.5 items-center justify-center relative shrink-0">
                                <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black text-center text-nowrap tracking-[-0.96px]">
                                    <p className="font-bold leading-[32px] text-[24px] whitespace-pre">
                                        <span className="text-[#0d0c07]">9</span>
                                        <span className="text-[#0d0c07]">meals</span>
                                        <span className="text-[#ffcb00]">.ai</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="content-stretch flex items-start justify-start relative shrink-0">
                            <div className="bg-white box-border content-stretch flex h-9 items-center justify-center px-3 py-1.5 relative rounded-[12px] shrink-0">
                                <div aria-hidden="true" className="absolute border-[#c1c0be] border-[0.5px] border-solid inset-0 pointer-events-none rounded-[12px]"></div>
                                
                                <div className="absolute content-stretch flex items-center justify-center opacity-0 top-1/2 translate-x-[-50%] translate-y-[-50%]" 
                                  style={{left: "calc(50% + 0.5px)"}}>
                                    <div className="opacity-0 relative shrink-0 w-6 h-6">
                                        <div className="absolute flex inset-[-0.86%_-0.87%_-0.86%_-0.86%] items-center justify-center">
                                            <div className="flex-none h-6 rotate-[1deg] w-[24px]">
                                                <div className="relative w-full h-full">
                                                    <svg preserveAspectRatio="none" width="100%" height="100%" overflow="visible" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <g id="container">
                                                            <g clipPath="url(#paint0_angular_1_626_clip_path)">
                                                                <g transform="matrix(0.012 0 0 0.012 12 12)">
                                                                    <foreignObject x="-1083.33" y="-1083.33" width="2166.67" height="2166.67">
                                                                        <div xmlns="http://www.w3.org/1999/xhtml"></div>
                                                                    </foreignObject>
                                                                </g>
                                                            </g>
                                                            <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                                                            <path id="Ellipse 8 (Stroke)" fillRule="evenodd" clipRule="evenodd" d="M22.7818 9.60074C23.3296 9.53007 23.8309 9.91682 23.9016 10.4646C23.9673 10.9738 24.0002 11.4866 24.0002 12C24.0002 12.5523 23.5525 13 23.0002 13C22.4479 13 22.0002 12.5523 22.0002 12C22.0002 11.5722 21.9727 11.1448 21.918 10.7205C21.8473 10.1727 22.2341 9.67141 22.7818 9.60074Z" fill="#0D0C07"/>
                                                        </g>
                                                        <defs>
                                                            <clipPath id="paint0_angular_1_626_clip_path">
                                                                <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                                                            </clipPath>
                                                        </defs>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Country Selector */}
                                <div className="content-stretch flex gap-1 items-center justify-center overflow-clip relative shrink-0">
                                    <div className="content-stretch flex items-start justify-start relative shrink-0">
                                        <div className="flex flex-col font-semibold justify-center leading-[0] relative shrink-0 text-[#0d0c07] text-[12px] text-center text-nowrap">
                                            <CountrySelector />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="content-stretch flex flex-col gap-2 items-center justify-start relative shrink-0 w-full">
                            <div className="content-stretch flex gap-2.5 items-start justify-start relative shrink-0 w-full">
                                <div className="basis-0 font-normal grow relative px-6 text-[#0d0c07] text-[14px] leading-[32px] text-center">
                                    <p className="leading-[20px]">{t('footer.tagline')}</p>
                                </div>
                            </div>
                            
                            <div className="content-stretch flex gap-1 pb-4 items-start justify-center relative shrink-0">
                                <div aria-hidden="true" className="absolute border-[#ffcb00] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0"></div>
                                <div className="font-semibold leading-[0] relative shrink-0 text-[#0d0c07] text-[14px] text-nowrap">
                                   <Link
                                      to="/aboutus"
                                      className="underline text-[#0D0C07] ml-2 md:hover:text-amber-500 focus:outline-none flex items-center"
                                    >
                                      {t('footer.learnMore')} 
                                      <svg preserveAspectRatio="none" width="20" height="20" overflow="visible" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g id="lucide/arrow-right">
                                            <path id="Vector" d="M4.58333 11H17.4167M17.4167 11L11 4.58333M17.4167 11L11 17.4167" stroke="#0D0C07" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                                        </g>
                                      </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-[#ebebea] box-border content-stretch flex flex-col gap-4 items-center justify-start pb-8 pt-5 px-0 relative shrink-0 w-full">
                <div aria-hidden="true" className="absolute border-[#e2e1df] border-[0.5px_0px_0px] border-solid inset-0 pointer-events-none"></div>
                
                <div className="content-stretch flex gap-6 items-start justify-center relative shrink-0 w-full">
                    <Link to="/privacy" className="content-stretch flex gap-1 items-start justify-center relative shrink-0 md:hover:opacity-70 transition-opacity">
                        <div aria-hidden="true" className="absolute border-[#ffcb00] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0"></div>
                        <div className="font-semibold leading-[0] relative shrink-0 text-[#0d0c07] text-[12px] text-nowrap">
                            <p className="leading-[20px] whitespace-pre">{t('footer.links.privacyPolicy')}</p>
                        </div>
                    </Link>
                    
                    <Link to="/cookies" className="content-stretch flex gap-1 items-start justify-center relative shrink-0 md:hover:opacity-70 transition-opacity">
                        <div aria-hidden="true" className="absolute border-[#ffcb00] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0"></div>
                        <div className="font-semibold leading-[0] relative shrink-0 text-[#0d0c07] text-[12px] text-nowrap">
                            <p className="leading-[20px] whitespace-pre">{t('footer.links.cookiePolicy')}</p>
                        </div>
                    </Link>
                    
                    <Link to="/contact" className="content-stretch flex gap-1 items-start justify-center relative shrink-0 md:hover:opacity-70 transition-opacity">
                        <div aria-hidden="true" className="absolute border-[#ffcb00] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0"></div>
                        <div className="font-semibold leading-[0] relative shrink-0 text-[#0d0c07] text-[12px] text-nowrap">
                            <p className="leading-[20px] whitespace-pre">{t('footer.links.contactUs')}</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
