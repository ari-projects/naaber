// CountrySelector.js
import React, { useState, useEffect } from 'react';
import { setUserCountry, getUserCountry, resetUserCountry } from '../../services/apiService';
import { getCountryFlag } from '../../utils/countryFlags';
import CountryDrawer from './Drawers/CountryDrawer';

const DEFAULT_COUNTRY = 'Spain';

/**
 * CountrySelector component for selecting user's country
 * @param {Object} props - Component props
 * @param {Function} props.onCountryChange - Optional callback when country changes
 * @returns {JSX.Element} The rendered component
 */
const CountrySelector = ({ onCountryChange }) => {
  const [currentCountry, setCurrentCountry] = useState(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Initialize with current country
  useEffect(() => {
    const initializeCountry = async () => {
      try {
        setIsLoading(true);
        const country = await getUserCountry();
        // Validate the country value is a string
        if (country && typeof country === 'string') {
          setCurrentCountry(country);
        } else {
          console.warn(`Invalid country value: ${country}, using default: ${DEFAULT_COUNTRY}`);
          setCurrentCountry(DEFAULT_COUNTRY);
        }
        
        if (onCountryChange) {
          onCountryChange(country || DEFAULT_COUNTRY);
        }
      } catch (error) {
        console.error('Error getting country:', error);
        setCurrentCountry(DEFAULT_COUNTRY);
      } finally {
        setIsLoading(false);
      }
    };
  
    initializeCountry();
  }, [onCountryChange]);
  
  // Handle country selection
  const handleCountrySelect = async (country) => {
    try {
      setIsLoading(true);
      await setUserCountry(country);
      setCurrentCountry(country);
      setIsDrawerOpen(false); // Close drawer after selection
      
      if (onCountryChange) {
        onCountryChange(country);
      }
    } catch (error) {
      console.error('Error setting country:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset to auto-detected country
  const handleReset = async () => {
    try {
      setIsLoading(true);
      const detectedCountry = await resetUserCountry();
      setCurrentCountry(detectedCountry);
      setIsDrawerOpen(false); // Close drawer after reset
      
      if (onCountryChange) {
        onCountryChange(detectedCountry);
      }
    } catch (error) {
      console.error('Error resetting country:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !currentCountry) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
        <span>...</span>
      </div>
    );
  }
  
  return (
    <div className="country-selector relative">
      {/* Click to open country drawer */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="flex items-center space-x-1 text-sm text-[#0D0C07] hover:opacity-80 transition-opacity"
      >
        <span className="mr-1 text-base">{getCountryFlag(currentCountry)}</span>
        <span>{currentCountry}</span>
      </button>
      
      {/* Country Selection Drawer */}
      <CountryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentCountry={currentCountry}
        onSelectCountry={handleCountrySelect}
        onReset={handleReset}
      />
    </div>
  );
};

export default CountrySelector;
