// useNavigationBlocker.js - Custom hook for blocking navigation with confirmation
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook that intercepts browser back button and shows a confirmation
 * before allowing navigation away from protected routes
 * 
 * @param {boolean} shouldBlock - Whether to block navigation
 * @param {function} onBlock - Callback when navigation is blocked (show confirmation drawer)
 */
export function useNavigationBlocker(shouldBlock, onBlock) {
  const location = useLocation();
  const navigate = useNavigate();
  const isBlockingRef = useRef(false);
  const pendingNavigationRef = useRef(null);
  const setupCompleteRef = useRef(false);

  useEffect(() => {
    console.log('[useNavigationBlocker] Effect:', { 
      shouldBlock, 
      pathname: location.pathname,
      historyLength: window.history.length
    });

    if (!shouldBlock) {
      isBlockingRef.current = false;
      setupCompleteRef.current = false;
      return;
    }

    isBlockingRef.current = true;

    // Handle browser back button via popstate
    const handlePopState = (event) => {
      console.log('[useNavigationBlocker] popstate fired:', { 
        isBlocking: isBlockingRef.current,
        pathname: location.pathname,
        state: event.state
      });
      
      if (isBlockingRef.current) {
        // Prevent the navigation by pushing the current state back
        window.history.pushState({ blocked: true }, '', location.pathname);
        pendingNavigationRef.current = 'back';
        
        console.log('[useNavigationBlocker] Blocked! Showing drawer');
        onBlock();
      }
    };

    // Setup the history barrier
    const setupBarrier = () => {
      if (setupCompleteRef.current) return;
      
      // Push barrier states to ensure we can intercept back button
      // We need at least one entry before our current position
      window.history.pushState({ barrier: true }, '', location.pathname);
      window.history.pushState({ current: true }, '', location.pathname);
      
      setupCompleteRef.current = true;
      console.log('[useNavigationBlocker] Pushed barrier states for:', location.pathname);
    };

    // Use a small delay to ensure React Router has finished its navigation
    const timeoutId = setTimeout(setupBarrier, 50);
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock, location.pathname, onBlock]);

  // Reset setup when pathname changes
  useEffect(() => {
    setupCompleteRef.current = false;
  }, [location.pathname]);

  // Function to call when user confirms they want to navigate
  const confirmNavigation = useCallback((destinationPath) => {
    console.log('[useNavigationBlocker] Confirming navigation to:', destinationPath);
    isBlockingRef.current = false;
    setupCompleteRef.current = false;
    pendingNavigationRef.current = null;
    navigate(destinationPath, { replace: true });
  }, [navigate]);

  // Function to cancel the navigation (just close drawer, stay on page)
  const cancelNavigation = useCallback(() => {
    console.log('[useNavigationBlocker] Cancelling navigation');
    pendingNavigationRef.current = null;
  }, []);

  return { confirmNavigation, cancelNavigation };
}

export default useNavigationBlocker;
